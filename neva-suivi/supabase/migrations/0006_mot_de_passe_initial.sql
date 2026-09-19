-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0006 : mot de passe initial choisi par l'admin (consigne 11)
--
-- L'admin saisit lui-même le mot de passe à la création d'un compte (plus
-- simple que d'envoyer un lien : il le donne de vive voix) ; l'utilisateur
-- doit le changer à sa première connexion, avant d'accéder au reste de
-- l'application.

alter table public.users
  add column mot_de_passe_a_changer boolean not null default false;

comment on column public.users.mot_de_passe_a_changer is
  'Force le passage par /changer-mot-de-passe avant tout accès (cahier consigne 11). Mis à true à la création par l''admin, remis à false par confirmer_changement_mot_de_passe().';

-- Même contrainte que definir_langue (migration 0004) : la policy
-- "users_update_admin_only" (migration 0001) réserve l'update de
-- public.users à l'admin. Fonction SECURITY DEFINER étroite pour que
-- l'utilisateur lève lui-même ce drapeau une fois son mot de passe changé,
-- sans pouvoir toucher au reste de sa ligne (rôle, actif...).
create or replace function public.confirmer_changement_mot_de_passe()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set mot_de_passe_a_changer = false where id = auth.uid();
end;
$$;

grant execute on function public.confirmer_changement_mot_de_passe() to authenticated;
