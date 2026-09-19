-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0003 : saisie par horaires de début/fin (consigne 6)
--
-- Deux modes coexistent à la saisie : total direct (existant) ou
-- début/fin/pause. Le total (colonne heures, déjà là) reste la seule valeur
-- exploitée aujourd'hui (back-office, export) ; le détail horaire n'est
-- stocké que pour ne pas le perdre si un jour il devient utile.

alter table public.saisies
  add column heure_debut time,
  add column heure_fin time,
  add column pause_minutes integer;

comment on column public.saisies.heure_debut is
  'Mode "horaires" (cahier consigne 6) uniquement ; null si saisie en mode "total direct".';
comment on column public.saisies.heure_fin is
  'Mode "horaires" uniquement ; null si saisie en mode "total direct".';
comment on column public.saisies.pause_minutes is
  'Mode "horaires" uniquement ; null si saisie en mode "total direct".';

-- Les trois colonnes du mode horaires vont ensemble ou pas du tout — jamais
-- un début renseigné sans fin (ou l'inverse), qui laisserait une saisie
-- dans un état ambigu quant à son mode d'origine.
alter table public.saisies add constraint saisie_horaires_toutes_ou_aucune check ((heure_debut is null and heure_fin is null and pause_minutes is null) or (heure_debut is not null and heure_fin is not null and pause_minutes is not null));
