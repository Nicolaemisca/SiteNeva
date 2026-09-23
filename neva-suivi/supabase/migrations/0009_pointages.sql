-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0009 : pointage personnel de l'admin (consigne 15)
--
-- Journal brut d'arrivées, propre au compte admin (cahier : "une appli web ne
-- peut pas suivre la position en tâche de fond ... pointage volontaire à
-- chaque arrivée"). Ligne = une arrivée sur un chantier ; la durée par
-- chantier se déduit ensuite des pointages successifs, calculée en
-- application (src/lib/recapPointage.ts) au moment de la clôture de journée,
-- jamais stockée ici. Une fois la journée clôturée, les lignes du jour sont
-- supprimées : le pointage n'est qu'un brouillon de calcul, la saisie qui en
-- résulte est la donnée qui fait foi (mêmes règles, même historique, mêmes
-- exports que toute autre saisie).

create table public.pointages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  chantier_id uuid not null references public.chantiers (id) on delete restrict,
  -- Même calcul que saisies.date (migration 0001) : date belge, pas UTC.
  date date not null default (
    (now() at time zone 'Europe/Brussels')::date
  ),
  horodatage timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  precision_metres double precision,
  created_at timestamptz not null default now()
);

comment on table public.pointages is
  'Journal brut des arrivées pointées par l''admin, consommé et vidé à la clôture de journée (cahier consigne 15).';

create index pointages_user_date_idx on public.pointages (user_id, date, horodatage);

alter table public.pointages enable row level security;

-- Réservé au compte admin, et chacun ne voit/écrit que ses propres pointages
-- (pas de notion de "pointage d'un autre admin") — is_admin() plutôt qu'un
-- id figé, cohérent avec le reste du schéma (cahier consigne 15 : "réservé
-- au compte admin", pas à une personne nommément désignée).
create policy "pointages_select_own_admin"
  on public.pointages for select
  using (user_id = auth.uid() and public.is_admin());

create policy "pointages_insert_own_admin"
  on public.pointages for insert
  with check (user_id = auth.uid() and public.is_admin());

-- Pas de update : un pointage erroné se supprime et se retape, il ne se
-- corrige pas (c'est un geste instantané, pas une saisie à éditer).
create policy "pointages_delete_own_admin"
  on public.pointages for delete
  using (user_id = auth.uid() and public.is_admin());
