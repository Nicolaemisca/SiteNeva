-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0001 : schéma de base, authentification, RLS (Phase 1)
--
-- Convention : les commentaires expliquent le POURQUOI de chaque choix,
-- pas le QUOI (déjà lisible dans le SQL).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- Valeurs d'enum sans accents : évite tout souci d'encodage côté client/ORM,
-- l'accentuation reste gérée à l'affichage (front).
create type public.user_role as enum ('technicien', 'admin');
create type public.chantier_type as enum ('regie', 'forfait');
create type public.chantier_statut as enum ('actif', 'termine', 'archive');

-- ---------------------------------------------------------------------------
-- public.users
-- ---------------------------------------------------------------------------
-- Un seul compte = une seule ligne auth.users + une seule ligne public.users,
-- même id des deux côtés (id = auth.users.id). C'est le pattern standard
-- Supabase : auth.users reste géré par le service d'auth (mot de passe, lien
-- magique), public.users porte les données métier (nom, rôle, actif) et sert
-- de point d'ancrage pour les policies RLS.
--
-- Pas d'inscription libre (cahier §2) : cette table n'est jamais peuplée par
-- un insert venant du client. Un trigger (plus bas) crée automatiquement la
-- ligne public.users dès qu'un compte auth.users est créé — et la création
-- d'un compte auth.users elle-même n'est possible que via l'API Admin
-- (service_role key), utilisée uniquement par l'administrateur / le script
-- de seed. Le rôle par défaut à la création est 'technicien' ; seul un admin
-- peut ensuite le faire passer à 'admin' (update, voir policies).
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  email text not null unique,
  role public.user_role not null default 'technicien',
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.users is
  'Profil métier des comptes. 1:1 avec auth.users. Créée par trigger, jamais par le client.';

-- ---------------------------------------------------------------------------
-- public.chantiers
-- ---------------------------------------------------------------------------
create table public.chantiers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  client text,
  adresse text,
  latitude double precision,
  longitude double precision,
  type public.chantier_type not null,
  budget_heures numeric(10, 2),
  statut public.chantier_statut not null default 'actif',
  created_at timestamptz not null default now(),

  -- Le budget d'heures n'a de sens qu'au forfait ; en régie on facture les
  -- heures réellement prestées, il n'y a rien à "consommer". La contrainte
  -- évite une donnée incohérente plutôt que de compter sur la discipline du
  -- back-office (cahier §3 : "budget_heures ... null si régie").
  constraint budget_heures_seulement_si_forfait check (
    type = 'forfait' or budget_heures is null
  )
);

comment on table public.chantiers is
  'Chantiers. GPS renseigné par géocodage côté back-office, jamais saisi à la main (cahier §5.1).';

-- Tri par distance (phase 4) : un index géographique simple suffit à ce
-- volume (quelques dizaines de chantiers actifs), pas besoin de PostGIS.
create index chantiers_statut_idx on public.chantiers (statut);

-- ---------------------------------------------------------------------------
-- public.postes_forfait
-- ---------------------------------------------------------------------------
create table public.postes_forfait (
  id uuid primary key default gen_random_uuid(),
  chantier_id uuid not null references public.chantiers (id) on delete cascade,
  libelle text not null,
  unite text not null,
  quantite_prevue numeric(10, 2) not null,
  heures_budget_unitaire numeric(10, 2),
  created_at timestamptz not null default now()
);

comment on table public.postes_forfait is
  'Postes définis par poste par l''admin sur un chantier au forfait. Propres au chantier (cahier §5.2).';

create index postes_forfait_chantier_id_idx on public.postes_forfait (chantier_id);

-- ---------------------------------------------------------------------------
-- public.saisies
-- ---------------------------------------------------------------------------
create table public.saisies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  chantier_id uuid not null references public.chantiers (id) on delete restrict,
  -- Date belge, pas UTC (cahier §7 "Fuseau et dates") : une saisie faite à
  -- 23h50 heure belge ne doit jamais basculer sur le lendemain UTC. On fige
  -- la timezone de calcul dans le défaut plutôt que de dépendre du
  -- fuseau de la session (variable selon le client qui écrit).
  date date not null default (
    (now() at time zone 'Europe/Brussels')::date
  ),
  heures numeric(5, 2) not null check (heures > 0 and heures <= 24),
  description text,
  materiel text, -- informatif uniquement (cahier §4.5) : pas de FK, pas de structure
  latitude_saisie double precision,
  longitude_saisie double precision,
  created_at timestamptz not null default now()
);

comment on table public.saisies is
  'Une ligne = un pointage journalier. GPS indicatif, jamais bloquant (cahier §7 "Vie privée").';

-- Pas de contrainte unique sur (user_id, chantier_id, date) : le cahier
-- demande un avertissement en cas de doublon, pas un blocage (§7 "Pas de
-- doublons" — un technicien peut légitimement avoir deux lignes le même
-- jour sur le même chantier, ex. matin/après-midi sur deux tâches). La
-- détection du doublon est un contrôle applicatif ; cet index la rend rapide.
create index saisies_dedup_idx on public.saisies (user_id, chantier_id, date);
create index saisies_chantier_id_idx on public.saisies (chantier_id);
create index saisies_date_idx on public.saisies (date);

-- ---------------------------------------------------------------------------
-- public.saisies_quantites
-- ---------------------------------------------------------------------------
create table public.saisies_quantites (
  id uuid primary key default gen_random_uuid(),
  saisie_id uuid not null references public.saisies (id) on delete cascade,
  poste_forfait_id uuid not null references public.postes_forfait (id) on delete restrict,
  quantite numeric(10, 2) not null check (quantite >= 0),
  created_at timestamptz not null default now()
);

comment on table public.saisies_quantites is
  'Avancement physique déclaré à la saisie. 0 à N lignes par saisie (cahier §3).';

create index saisies_quantites_saisie_id_idx on public.saisies_quantites (saisie_id);
create index saisies_quantites_poste_forfait_id_idx on public.saisies_quantites (poste_forfait_id);

-- Intégrité croisée qu'une simple FK ne peut pas exprimer : le poste choisi
-- doit appartenir au même chantier que la saisie. Sans ce trigger, un bug
-- front pourrait rattacher l'avancement d'un chantier au budget d'un autre —
-- silencieusement, puisque les deux FK prises séparément resteraient valides.
create or replace function public.check_poste_forfait_chantier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chantier_saisie uuid;
  v_chantier_poste uuid;
begin
  select chantier_id into v_chantier_saisie from public.saisies where id = new.saisie_id;
  select chantier_id into v_chantier_poste from public.postes_forfait where id = new.poste_forfait_id;

  if v_chantier_saisie is distinct from v_chantier_poste then
    raise exception 'Le poste de forfait n''appartient pas au chantier de la saisie';
  end if;

  return new;
end;
$$;

create trigger saisies_quantites_check_chantier
  before insert or update on public.saisies_quantites
  for each row execute function public.check_poste_forfait_chantier();

-- ---------------------------------------------------------------------------
-- Trigger : création automatique de public.users à la création d'un compte
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER : nécessaire pour écrire dans public.users depuis un
-- trigger déclenché sur auth.users (schéma que le rôle appelant ne peut pas
-- modifier directement). search_path figé pour éviter tout détournement de
-- fonction par un search_path manipulé (bonne pratique Postgres/Supabase).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, nom, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nom', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires pour les policies RLS
-- ---------------------------------------------------------------------------
-- is_admin() : SECURITY DEFINER + STABLE pour être évaluée une fois par
-- requête sans re-déclencher elle-même les policies de public.users
-- (sinon : récursion policy -> fonction -> policy).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin' and actif = true
  );
$$;

-- Fenêtre de correction technicien : 7 jours glissants, en date belge
-- (cahier §2 et §4 "corriger ses saisies des 7 derniers jours").
create or replace function public.within_correction_window(d date)
returns boolean
language sql
stable
as $$
  select d >= ((now() at time zone 'Europe/Brussels')::date - 7);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.chantiers enable row level security;
alter table public.postes_forfait enable row level security;
alter table public.saisies enable row level security;
alter table public.saisies_quantites enable row level security;

-- users : chacun voit sa propre ligne (nécessaire pour lire son rôle côté
-- app), l'admin voit tout. Pas d'insert client (trigger uniquement). Seul
-- l'admin peut modifier (rôle, actif, nom) ; un technicien ne peut pas
-- s'auto-promouvoir admin.
create policy "users_select_own_or_admin"
  on public.users for select
  using (id = auth.uid() or public.is_admin());

create policy "users_update_admin_only"
  on public.users for update
  using (public.is_admin())
  with check (public.is_admin());

-- chantiers : les techniciens ne doivent voir que les chantiers actifs
-- (ceux qu'ils peuvent sélectionner à la saisie) ; l'admin gère tout,
-- y compris les chantiers terminés/archivés pour consultation et export.
create policy "chantiers_select_actifs_or_admin"
  on public.chantiers for select
  using (statut = 'actif' or public.is_admin());

create policy "chantiers_write_admin_only"
  on public.chantiers for insert
  with check (public.is_admin());

create policy "chantiers_update_admin_only"
  on public.chantiers for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "chantiers_delete_admin_only"
  on public.chantiers for delete
  using (public.is_admin());

-- postes_forfait : lecture ouverte à qui peut déjà voir le chantier parent
-- (même règle actif/admin, via jointure) ; écriture réservée à l'admin.
create policy "postes_forfait_select_via_chantier"
  on public.postes_forfait for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.chantiers c
      where c.id = postes_forfait.chantier_id and c.statut = 'actif'
    )
  );

create policy "postes_forfait_write_admin_only"
  on public.postes_forfait for insert
  with check (public.is_admin());

create policy "postes_forfait_update_admin_only"
  on public.postes_forfait for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "postes_forfait_delete_admin_only"
  on public.postes_forfait for delete
  using (public.is_admin());

-- saisies : chacun ne voit et n'écrit que ses propres lignes, l'admin voit
-- et corrige tout sans limite de date. L'insert n'est pas borné dans le
-- temps (un technicien doit pouvoir rattraper un oubli d'hier), seules la
-- modification et la suppression sont bornées aux 7 derniers jours pour un
-- technicien (cahier §4 "au-delà, la correction passe par l'administrateur").
create policy "saisies_select_own_or_admin"
  on public.saisies for select
  using (user_id = auth.uid() or public.is_admin());

create policy "saisies_insert_own"
  on public.saisies for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "saisies_update_own_recent_or_admin"
  on public.saisies for update
  using (
    public.is_admin()
    or (user_id = auth.uid() and public.within_correction_window(date))
  )
  with check (
    public.is_admin()
    or (user_id = auth.uid() and public.within_correction_window(date))
  );

create policy "saisies_delete_own_recent_or_admin"
  on public.saisies for delete
  using (
    public.is_admin()
    or (user_id = auth.uid() and public.within_correction_window(date))
  );

-- saisies_quantites : hérite des droits de la saisie parente plutôt que de
-- dupliquer une notion de propriétaire (une ligne de quantité n'a pas de
-- user_id propre — cahier §3 : elle "lie une saisie aux quantités").
create policy "saisies_quantites_select_via_saisie"
  on public.saisies_quantites for select
  using (
    exists (
      select 1 from public.saisies s
      where s.id = saisies_quantites.saisie_id
        and (s.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "saisies_quantites_insert_via_saisie"
  on public.saisies_quantites for insert
  with check (
    exists (
      select 1 from public.saisies s
      where s.id = saisies_quantites.saisie_id
        and (s.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "saisies_quantites_update_via_saisie"
  on public.saisies_quantites for update
  using (
    exists (
      select 1 from public.saisies s
      where s.id = saisies_quantites.saisie_id
        and (public.is_admin() or (s.user_id = auth.uid() and public.within_correction_window(s.date)))
    )
  )
  with check (
    exists (
      select 1 from public.saisies s
      where s.id = saisies_quantites.saisie_id
        and (public.is_admin() or (s.user_id = auth.uid() and public.within_correction_window(s.date)))
    )
  );

create policy "saisies_quantites_delete_via_saisie"
  on public.saisies_quantites for delete
  using (
    exists (
      select 1 from public.saisies s
      where s.id = saisies_quantites.saisie_id
        and (public.is_admin() or (s.user_id = auth.uid() and public.within_correction_window(s.date)))
    )
  );
