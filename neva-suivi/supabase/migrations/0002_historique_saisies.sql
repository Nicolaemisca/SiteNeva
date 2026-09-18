-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0002 : historique des modifications de saisies (consigne 4)
--
-- Contexte : un technicien peut corriger lui-même une saisie récente
-- (policy saisies_update_own_recent_or_admin, migration 0001), l'admin doit
-- pouvoir voir qu'une valeur a changé. Traçabilité, pas surveillance : pas
-- de notification, juste un accès au détail dans le back-office.

-- ---------------------------------------------------------------------------
-- public.saisies_historique
-- ---------------------------------------------------------------------------
create table public.saisies_historique (
  id uuid primary key default gen_random_uuid(),
  saisie_id uuid not null references public.saisies (id) on delete cascade,
  modifie_par uuid not null references public.users (id),
  modifie_le timestamptz not null default now(),
  -- Snapshot de la ligne entière plutôt qu'un diff champ par champ : un seul
  -- trigger générique (to_jsonb(old)/to_jsonb(new)), pas de logique à
  -- maintenir si de nouvelles colonnes sont ajoutées à saisies plus tard.
  -- Le diff se calcule à l'affichage (back-office).
  ancien jsonb not null,
  nouveau jsonb not null
);

comment on table public.saisies_historique is
  'Historique des modifications de saisies (qui/quand/avant/après). Rempli uniquement par trigger, jamais par le client (cahier consigne 4).';

create index saisies_historique_saisie_id_idx on public.saisies_historique (saisie_id);

-- ---------------------------------------------------------------------------
-- Trigger : capture automatique à chaque UPDATE réel sur saisies
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER pour écrire dans une table que le rôle appelant (RLS)
-- n'a pas le droit d'insérer directement — même pattern que
-- handle_new_user() dans la migration 0001. auth.uid() reste celui de la
-- requête cliente en cours (technicien ou admin), pas le définisseur.
create or replace function public.enregistrer_modification_saisie()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.saisies_historique (saisie_id, modifie_par, ancien, nouveau)
  values (old.id, auth.uid(), to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;

-- "when (old is distinct from new)" : pas d'entrée d'historique pour un
-- update qui ne change en réalité aucune valeur (comparaison de la ligne
-- entière, gère les null correctement contrairement à old <> new).
create trigger saisies_historiser_modification
  after update on public.saisies
  for each row
  when (old is distinct from new)
  execute function public.enregistrer_modification_saisie();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Lecture réservée à l'admin (back-office, cahier consigne 4) : le
-- technicien corrige via l'écran normal, il n'a pas besoin de consulter son
-- propre historique de corrections. Pas de policy d'insert : seul le
-- trigger (security definer) écrit ici, jamais un insert client direct.
alter table public.saisies_historique enable row level security;

create policy "saisies_historique_select_admin_only"
  on public.saisies_historique for select
  using (public.is_admin());
