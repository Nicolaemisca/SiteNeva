# Consignes pour Claude Code — application de suivi des heures Neva Energy

Document préparé le 18 septembre 2026.

Avancement : consigne 1 résolue (la piste Tailwind était fausse, corrigé comme
effet de bord du nettoyage Vercel). Consigne 3 implémentée sur la branche
consigne-3-gestion-utilisateurs.

Mode d'emploi : une consigne à la fois, chacune sur sa propre branche Git.
Phrase d'ouverture type : « Crée une branche pour ce qui suit, implémente-le,
et dis-moi comment le tester. »
Ne passe à la suivante qu'une fois la précédente testée et fusionnée.

---

## 1. Corriger l'absence de styles en production

Contexte : sur site-neva.vercel.app, les pages s'affichent en HTML brut — liens
violets soulignés, polices par défaut du navigateur. À faire en premier : tout
le reste s'affichera dans cette mise en page.

> En production sur site-neva.vercel.app, les pages s'affichent sans aucun style,
> avec les polices et les liens par défaut du navigateur. Vérifie que Tailwind est
> bien compilé et appliqué en production, corrige la cause, et explique-moi ce qui
> n'allait pas.

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

## 9. Archivage et suppression d'un chantier

Contexte : un chantier terminé doit sortir de la liste de saisie sans disparaître
de la base. Un chantier créé par erreur, lui, doit pouvoir être effacé — mais
seulement s'il ne porte aucune heure.

> Ajoute dans le back-office la possibilité d'archiver un chantier : il n'apparaît
> plus dans la liste de saisie des techniciens, mais reste consultable et
> exportable côté admin, avec ses saisies intactes. Ajoute aussi la suppression
> d'un chantier, autorisée uniquement s'il ne porte aucune saisie ; sinon propose
> l'archivage à la place et explique pourquoi.

---

## 10. Suppression de saisies par l'admin

Contexte : nettoyer les lignes créées pendant les tests. Attention, demain ce
seront de vraies heures prestées : la suppression laisse une trace, comme les
modifications.

> Permets à l'admin de supprimer une saisie depuis le back-office, avec
> confirmation explicite. Enregistre la suppression dans l'historique : quelle
> saisie, quel contenu, qui l'a supprimée, quand. Ajoute aussi une action de
> suppression multiple pour nettoyer les données de test.

---

## 11. Mot de passe initial défini par l'admin

Contexte : plus simple que d'envoyer un lien — tu donnes le mot de passe de vive
voix au technicien, et il le change lui-même ensuite.

> À la création d'un compte, laisse l'admin saisir lui-même un mot de passe
> initial. Force l'utilisateur à le changer à sa première connexion, avant
> d'accéder à l'application.

---

## 12. Vue compacte des heures dans le back-office

Contexte : quatre personnes qui encodent tous les jours, cela fait vite plusieurs
milliers de lignes. L'affichage doit tenir la charge et se lire comme un tableur.

> Dans le back-office, affiche les saisies sous forme de tableau dense type
> tableur : lignes serrées, en-têtes fixes au défilement, tri par colonne, filtres
> par période, chantier et utilisateur, et pagination. Prévois plusieurs milliers
> de lignes.

---

## 13. Marquage des heures déjà exportées

Contexte : éviter de facturer deux fois les mêmes heures. C'est le risque le plus
coûteux de toute l'application.

> Marque les saisies incluses dans un export : date d'export et indication visuelle
> dans le tableau. Permets de filtrer sur les non exportées uniquement, et propose
> par défaut l'export des seules saisies jamais exportées.

---

## 14. Suppression d'un utilisateur

Contexte : même logique que pour les chantiers. Un compte qui porte des heures ne
se supprime pas, il se désactive.

> Ajoute la suppression d'un utilisateur, autorisée uniquement s'il ne porte aucune
> saisie. Sinon propose la désactivation à la place et explique pourquoi.

---

## Points restés en suspens

- Révoquer l'ancienne clé secret Supabase nommée « default », une fois la nouvelle
  clé validée en local ET en production.
- Vérifier que la variable SUPABASE_SERVICE_ROLE_KEY est bien présente dans Vercel,
  puis redéployer : Vercel n'applique pas une nouvelle variable au site déjà en ligne.
- Tester l'accès au back-office depuis un compte technicien : il doit être refusé.
- Valider le tri des chantiers par distance en extérieur, et vérifier que la liste
  ne se réorganise pas après la sélection d'un chantier.
- Ajouter l'application à l'écran d'accueil du téléphone.
- Vérifier le bug des boutons de préréglage d'heures sur mobile.
- Vérifier la conformité Nominatim : une requête par seconde maximum, et en-tête
  d'identification obligatoire.
- Phase 5 du cahier des charges : forfaits et calcul de dérive.
- Phase 6 : mode hors connexion. C'est le principal risque d'abandon sur chantier.
