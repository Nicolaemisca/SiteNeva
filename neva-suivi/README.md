# Neva Energy — Suivi des heures et de l'avancement chantier

Phase 1 du cahier des charges : schéma PostgreSQL, RLS, authentification
Supabase à deux rôles. Les phases suivantes (écran de saisie, back-office,
GPS, forfait, hors-ligne) ne sont pas encore implémentées.

## Mise en place

1. Créer un projet Supabase.
2. Appliquer la migration :
   ```bash
   supabase link --project-ref <ref-du-projet>
   supabase db push
   ```
   (ou coller le contenu de `supabase/migrations/0001_init.sql` dans le SQL
   Editor du dashboard).
3. Dans **Authentication → Providers → Email** : garder Email/Password
   activé et activer les liens magiques (Magic Link). Dans
   **Authentication → Settings**, désactiver **Allow new users to sign up** :
   les comptes ne se créent que via l'API Admin (cahier §2, pas
   d'inscription libre).
4. Copier `.env.local.example` en `.env.local` et remplir les clés
   (URL, anon key, service role key) depuis **Project Settings → API**.
5. Créer les 4 comptes :
   ```bash
   npm install
   npm run seed:users
   ```
   Adapter d'abord les emails dans `scripts/seed-users.mjs`.
6. Lancer l'app :
   ```bash
   npm run dev
   ```
   Se connecter sur `/login` avec un des comptes créés : la page d'accueil
   affiche le nom et le rôle lus depuis `public.users`, ce qui valide que le
   schéma, les policies RLS et l'authentification fonctionnent ensemble.

## Décisions de schéma (résumé)

Voir les commentaires dans `supabase/migrations/0001_init.sql` pour le détail
de chaque choix. Points notables :

- `public.users` est une table séparée de `auth.users`, alimentée par un
  trigger à la création du compte — jamais par un insert client.
- Contrainte `budget_heures` : impossible de la renseigner sur un chantier
  en régie (incohérence détectée à l'écriture, pas seulement à l'usage).
- Dates de saisie calculées en fuseau `Europe/Brussels`, pas en UTC.
- Pas de contrainte unique anti-doublon (le cahier demande un avertissement,
  pas un blocage) — juste un index pour que la vérification applicative
  reste rapide.
- Un trigger garantit qu'un poste de forfait saisi appartient bien au
  chantier de la saisie (une FK seule ne peut pas l'exprimer).
- RLS : fonctions `is_admin()` et `within_correction_window()` centralisent
  la logique de rôle et la fenêtre de correction de 7 jours, réutilisées par
  toutes les policies plutôt que dupliquées table par table.

## Déploiement

Ce dossier est un projet Next.js autonome à l'intérieur du dépôt (le
`index.html` à la racine du dépôt est le site vitrine existant, distinct de
cette application). Sur Vercel, créer un projet séparé avec **Root
Directory** = `neva-suivi`.
