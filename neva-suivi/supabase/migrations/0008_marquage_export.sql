-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0008 : marquage des heures déjà exportées (consigne 13)
--
-- Risque le plus coûteux de l'application (cahier) : facturer deux fois les
-- mêmes heures. exportee_le mémorise la dernière fois qu'une saisie a été
-- incluse dans un export Excel — nullable : jamais exportée tant que null.

alter table public.saisies add column exportee_le timestamptz;

comment on column public.saisies.exportee_le is
  'Date du dernier export Excel incluant cette saisie (null = jamais exportée). Posé par /admin/export (cahier consigne 13).';

-- Recréée avec la nouvelle colonne (create or replace view ne permet pas
-- d'insérer une colonne au milieu, mais l'ajouter en fin de liste suffit
-- ici) : /admin/saisies (consigne 12) doit pouvoir filtrer et afficher
-- exportee_le sans jointure supplémentaire.
create or replace view public.saisies_detaillees
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
  u.nom as personne_nom,
  s.exportee_le
from public.saisies s
join public.chantiers c on c.id = s.chantier_id
join public.users u on u.id = s.user_id;
