-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0005 : trace des saisies supprimées par l'admin (consigne 10)
--
-- Contexte : nettoyer les lignes de test aujourd'hui, mais demain ce seront
-- de vraies heures prestées — la suppression doit laisser une trace, comme
-- les modifications (saisies_historique, migration 0002).
--
-- saisies_historique ne convient pas ici : saisie_id y référence
-- saisies(id) on delete cascade, donc toute ligne y insérée pour une
-- suppression serait elle-même effacée en cascade par cette suppression.
-- Table dédiée, sans FK vers saisies (la ligne n'existe plus une fois le
-- trigger passé), même principe de snapshot jsonb que la migration 0002.

-- ---------------------------------------------------------------------------
-- public.saisies_supprimees
-- ---------------------------------------------------------------------------
create table public.saisies_supprimees (
  id uuid primary key default gen_random_uuid(),
  -- Pas de foreign key : la ligne public.saisies référencée n'existe plus
  -- une fois cette ligne insérée (trigger before delete, voir plus bas).
  saisie_id uuid not null,
  supprime_par uuid not null references public.users (id),
  supprime_le timestamptz not null default now(),
  contenu jsonb not null
);

comment on table public.saisies_supprimees is
  'Trace des saisies supprimées par l''admin (quoi/qui/quand). Remplie uniquement par trigger, jamais par le client (cahier consigne 10).';

create index saisies_supprimees_supprime_le_idx on public.saisies_supprimees (supprime_le);

-- ---------------------------------------------------------------------------
-- Trigger : capture automatique à chaque DELETE sur saisies
-- ---------------------------------------------------------------------------
-- BEFORE DELETE (pas AFTER) : old.id doit encore être une valeur valide au
-- moment de l'insert, la ligne saisies n'a pas encore disparu. SECURITY
-- DEFINER + search_path figé : même pattern que enregistrer_modification_saisie
-- (migration 0002).
create or replace function public.enregistrer_suppression_saisie()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.saisies_supprimees (saisie_id, supprime_par, contenu)
  values (old.id, auth.uid(), to_jsonb(old));
  return old;
end;
$$;

create trigger saisies_historiser_suppression
  before delete on public.saisies
  for each row
  execute function public.enregistrer_suppression_saisie();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Lecture réservée à l'admin, même règle que saisies_historique. Pas de
-- policy d'insert : seul le trigger (security definer) écrit ici.
alter table public.saisies_supprimees enable row level security;

create policy "saisies_supprimees_select_admin_only"
  on public.saisies_supprimees for select
  using (public.is_admin());
