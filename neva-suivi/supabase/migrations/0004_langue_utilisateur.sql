-- Neva Energy — suivi des heures et de l'avancement chantier
-- Migration 0004 : langue de l'interface par utilisateur (consigne 8)
--
-- Français/roumain, mémorisé par compte. Le back-office admin reste en
-- français quel que soit ce réglage (cahier consigne 8) : seuls les écrans
-- technicien (saisie, historique, profil) le lisent.

alter table public.users add column langue text not null default 'fr' check (langue in ('fr', 'ro'));

comment on column public.users.langue is
  'Langue de l''interface technicien (fr/ro, cahier consigne 8). Le back-office admin reste toujours en français.';

-- La policy "users_update_admin_only" (migration 0001) réserve l'update de
-- public.users à l'admin (un technicien ne doit pas pouvoir s'auto-promouvoir
-- ou se réactiver) : pas question de l'assouplir pour langue. Une fonction
-- SECURITY DEFINER étroite, sur le modèle de is_admin(), laisse chaque
-- utilisateur changer sa propre langue sans toucher au reste de la ligne.
create or replace function public.definir_langue(p_langue text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_langue not in ('fr', 'ro') then
    raise exception 'langue invalide : %', p_langue;
  end if;

  update public.users set langue = p_langue where id = auth.uid();
end;
$$;

grant execute on function public.definir_langue(text) to authenticated;
