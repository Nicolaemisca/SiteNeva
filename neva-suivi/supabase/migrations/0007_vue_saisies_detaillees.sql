-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0007 : vue à plat pour le tri par chantier/personne (consigne 12)
--
-- PostgREST/supabase-js n'utilise .order(colonne, { referencedTable }) que
-- pour trier les sous-lignes d'un embed imbriqué, jamais pour réordonner les
-- lignes de la table parente elle-même (vérifié empiriquement : un tri
-- "chantier desc" via chantiers!inner(nom) renvoyait le même ordre que
-- "asc"). Une vue à plat expose chantier_nom/personne_nom comme colonnes
-- normales de premier niveau, triables sans détour.
create view public.saisies_detaillees
with (security_invoker = true)
as
select
  s.id,
  s.date,
  s.heures,
  s.description,
  s.materiel,
  s.chantier_id,
  s.user_id,
  c.nom as chantier_nom,
  u.nom as personne_nom
from public.saisies s
join public.chantiers c on c.id = s.chantier_id
join public.users u on u.id = s.user_id;

comment on view public.saisies_detaillees is
  'Saisies à plat avec noms de chantier/personne, pour tri par colonne côté back-office (cahier consigne 12). security_invoker : hérite des policies RLS de public.saisies (chacun ne voit que les siennes, l''admin voit tout) — aucune policy propre à ajouter.';
