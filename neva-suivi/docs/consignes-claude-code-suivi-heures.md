# Consignes pour Claude Code — application de suivi des heures Neva Energy

Document préparé le 18 septembre 2026.

Mode d'emploi : une consigne à la fois, chacune sur sa propre branche Git.
Phrase d'ouverture type : « Crée une branche pour ce qui suit, implémente-le,
et dis-moi comment le tester. »
Ne passe à la suivante qu'une fois la précédente testée et fusionnée.

---

## 1. Corriger l'absence de styles en production — ✅ résolu (18/09/2026)

Contexte : sur site-neva.vercel.app, les pages s'affichent en HTML brut — liens
violets soulignés, polices par défaut du navigateur. À faire en premier : tout
le reste s'affichera dans cette mise en page.

> En production sur site-neva.vercel.app, les pages s'affichent sans aucun style,
> avec les polices et les liens par défaut du navigateur. Vérifie que Tailwind est
> bien compilé et appliqué en production, corrige la cause, et explique-moi ce qui
> n'allait pas.

**Résolution** : ce projet n'utilise pas Tailwind — l'application est stylée
entièrement en styles inline React (`style={{...}}`) depuis la phase 1, la
piste Tailwind était donc fausse. Le HTML brut venait de la confusion
provoquée par 4 projets Vercel dupliqués pointant sur le même dépôt GitHub
(créés lors de tentatives répétées de configuration du Root Directory) ; l'un
d'eux ne parvenait jamais à builder l'app Next.js. Les 4 projets ont été
supprimés et remplacés par un seul projet Vercel propre. Vérifié en direct
côté serveur (HTML renvoyé avec les styles inline présents) et confirmé par
l'utilisateur sur site-neva.vercel.app.

---

## 2. Identité visuelle et confirmation de saisie

Contexte : une fois les styles réparés, rendre l'application agréable. Le point
le plus utile n'est pas décoratif : le technicien doit voir sans ambiguïté que
sa saisie est bien partie.

> Applique une identité visuelle soignée à l'ensemble de l'application, avec des
> transitions douces entre les états. Ajoute une confirmation visuelle nette après
> l'enregistrement d'une saisie. Garde des zones tactiles larges : l'usage se fait
> sur téléphone, souvent avec les mains sales.

Note : le logo Neva Energy est à récupérer depuis le site ou depuis Odoo, au
format SVG ou PNG transparent, à déposer dans le dossier public, puis à utiliser
en en-tête, sur la page de connexion et comme icône d'application.

---

## 3. Gestion des utilisateurs dans le back-office

Contexte : aujourd'hui, créer un compte suppose de relancer un script dans le
terminal. Ce doit devenir une page du back-office pour ne plus jamais y toucher.

> Ajoute dans le back-office une page de gestion des utilisateurs, réservée à
> l'admin : créer un compte avec email, nom et rôle, désactiver un compte sans le
> supprimer, et réinitialiser un mot de passe. Un compte désactivé ne peut plus se
> connecter mais ses saisies passées restent intactes.

---

## 4. Historique des modifications de saisies

Contexte : un technicien qui s'est trompé d'heure doit pouvoir corriger lui-même,
mais l'admin doit voir que la valeur a changé. Pas de surveillance : de la
traçabilité.

> Ajoute une table d'historique des modifications de saisies : ancienne valeur,
> nouvelle valeur, qui a modifié, quand. Remplie automatiquement par un trigger sur
> update. Dans le back-office, une saisie modifiée est signalée visuellement, avec
> accès au détail des changements. Passe par un nouveau fichier de migration
> numéroté, sans toucher aux migrations déjà appliquées.

---

## 5. Pré-remplissage intelligent de la saisie

Contexte : les techniciens restent longtemps sur le même chantier avec le même
horaire. L'appli doit proposer, jamais décider à leur place.

> Pré-remplis l'écran de saisie avec le chantier et le nombre d'heures les plus
> fréquents dans les saisies de l'utilisateur sur les deux dernières semaines.
> Distingue les jours de semaine du samedi : pour un samedi, ne propose que ce qui
> vient d'autres samedis. Si l'historique est insuffisant, ne propose rien plutôt
> qu'une valeur fausse. Affiche clairement qu'il s'agit d'une proposition
> modifiable, et n'enregistre rien sans validation explicite.

---

## 6. Saisie par horaires de début et de fin

Contexte : saisir six heures à dix-sept heures avec une pause est plus fidèle
qu'un total. Mais le bouton « 10 heures » reste plus rapide un soir de fatigue :
les deux modes coexistent.

> Ajoute un mode de saisie par horaires : heure de début, heure de fin, durée de
> pause dans un menu déroulant à valeurs prédéfinies. Affiche le total calculé en
> temps réel. Conserve le mode de saisie directe du total en heures, l'utilisateur
> choisit son mode. Stocke en base le détail horaire et le total, même si seul le
> total est exploité aujourd'hui. Applique aussi le pré-remplissage aux horaires.

---

## 7. Session persistante sur mobile

Contexte : trois demandes de mot de passe et l'application est abandonnée. Point
critique pour l'adoption.

> Vérifie que la session reste active durablement sur mobile, avec renouvellement
> automatique du jeton, pour que le technicien n'ait pas à se reconnecter à chaque
> ouverture de l'application. Dis-moi comment le tester.

---

## 8. Multilingue français et roumain

Contexte : les techniciens sont roumanophones. À faire maintenant plutôt que dans
six mois : plus l'application grandit, plus il y a de textes à extraire.

> Ajoute le multilingue français et roumain : sors tous les textes de l'interface
> dans des fichiers de traduction, ajoute un sélecteur de langue dans le profil
> utilisateur, et mémorise le choix par utilisateur. Le back-office admin reste en
> français. Les dates et les nombres restent au format belge dans les deux langues.

Note : relis toi-même les traductions roumaines ou fais-les relire par un de tes
associés — le vocabulaire du chantier ne s'invente pas.

---

## Points restés en suspens

- Régénérer la clé secret Supabase et la reporter dans le fichier .env.local et
  dans Vercel. Elle a circulé en clair.
- Vérifier que la variable SUPABASE_SERVICE_ROLE_KEY est bien présente dans Vercel.
- Tester l'accès au back-office depuis un compte technicien : il doit être refusé.
- Valider le tri des chantiers par distance en extérieur, et vérifier que la liste
  ne se réorganise pas après la sélection d'un chantier.
- Ajouter l'application à l'écran d'accueil du téléphone.
- Vérifier le bug des boutons de préréglage d'heures sur mobile.
- Vérifier la conformité Nominatim : une requête par seconde maximum, et en-tête
  d'identification obligatoire.
- Phase 5 du cahier des charges : forfaits et calcul de dérive.
- Phase 6 : mode hors connexion. C'est le principal risque d'abandon sur chantier.
