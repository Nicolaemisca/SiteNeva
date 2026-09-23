-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0010 : tarif horaire par utilisateur (consigne 17)
--
-- Table séparée plutôt qu'une colonne sur public.users : la policy
-- "users_select_own_or_admin" (migration 0001) laisse un technicien lire sa
-- propre ligne — une colonne tarif_horaire posée dessus serait donc
-- accessible à sa propre requête (RLS filtre des LIGNES, pas des colonnes),
-- malgré tout masquage côté app. Le cahier est explicite : "jamais côté
-- technicien, y compris sur son propre profil". Seule une table à part, dont
-- la policy ne connaît QUE is_admin() (aucune exception "own row"), le
-- garantit réellement — même principe que le reste du schéma : RLS est la
-- vraie barrière, l'app n'est qu'un confort d'affichage.

create table public.tarifs_horaires (
  user_id uuid primary key references public.users (id) on delete cascade,
  tarif_horaire numeric(10, 2) not null check (tarif_horaire >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.tarifs_horaires is
  'Tarif horaire par utilisateur, visible/modifiable uniquement par l''admin, jamais par le technicien concerné (cahier consigne 17).';

alter table public.tarifs_horaires enable row level security;

-- Une policy par opération (convention du reste du schéma), toutes
-- identiques à is_admin() seul — délibérément aucune clause "or id =
-- auth.uid()" nulle part ici, contrairement à public.users.
create policy "tarifs_horaires_select_admin_only"
  on public.tarifs_horaires for select
  using (public.is_admin());

create policy "tarifs_horaires_insert_admin_only"
  on public.tarifs_horaires for insert
  with check (public.is_admin());

create policy "tarifs_horaires_update_admin_only"
  on public.tarifs_horaires for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "tarifs_horaires_delete_admin_only"
  on public.tarifs_horaires for delete
  using (public.is_admin());
