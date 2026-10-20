# Historique du projet

Résumé des sessions de travail, du plus ancien au plus récent.

## Session 1 : création et mise en forme (septembre – octobre 2026)

### Création
- Projet Ionic 8 + Vue 3 + Capacitor 8 (Android), créé dans « Levo Reminder ».
- Fonctionnalités : ajout/suppression de rappels, page générique par médicament, fréquence (tous les jours, certains jours, tous les N jours), notification locale avec relances de plus en plus insistantes (nombre et délai réglables), coche (pris) / croix (ignoré), calendrier de suivi.
- Stockage local derrière l'interface `MedicationRepository` (point d'extension pour un futur cloud).
- Notifications : fenêtre glissante de 14 jours, replanifiée à chaque ouverture de l'app ; clic sur la notification → page du médicament.

### Apparence
- Thème beige partout ; cartes plus claires (`--levo-card`) ; couleur principale brune ; rouge de la croix partagé avec le bouton de suppression (bordure 3 px) ; couleurs de la coche et de la croix réglables dans `variables.css`.
- Champs (`ion-input`, `ion-select`) en contour arrondi, alignés ; slider, toggle et bouton + accordés au thème.
- Titre du header de la page médicament aligné à gauche ; barre de navigation Android masquée (`SystemBars`).
- Logo : gélule bicolore et étincelles dorées. Sources dans `resources/`, génération des icônes Android (classique, adaptative, notification monochrome) par `npm run icons`.
- Styles rangés : `variables.css` (jetons) et `overrides.css` (surcharges Ionic), rendu vérifié identique avant/après.

### Fonctionnalités ajoutées en cours de route
- Messages de notification extraits dans `notificationMessages.ts` : 7 niveaux × 30 messages, tirés au hasard ; niveaux 1 à 6 de plus en plus insultants (choix assumé de l'utilisateur).
- Renommage d'un médicament en touchant son titre (validé quand le champ perd le focus, Échap annule).

### Qualité et workflow
- Nettoyage (dépendances inutiles, tests du starter) et 57 tests unitaires Vitest (modèle, stockage, notifications, store, calendrier, formulaire, barres système).
- Travail d'abord par pull requests (trois fusionnées par l'utilisateur), puis, à sa demande, commits directs sur `master` ; l'utilisateur pousse lui-même (l'authentification GitHub n'est pas disponible dans l'environnement de l'assistant).

### Points d'attention techniques
- `structuredClone` échoue sur les proxys réactifs de Vue : on utilise `clone()` (JSON).
- Le dossier `android/` n'est pas versionné : après `npx cap add android`, relancer `npm run icons`.
- Aucun Android SDK sur la machine de développement (JDK 21 présent dans le PATH) : pas d'APK ni de test des notifications possibles hors d'Android Studio / d'un téléphone.

## Sous-agents (fin de session 1)
- Les quatre agents du projet Blog (`coder`, `proof-reader`, `security-reviewer`, `tester`) ont été recopiés dans `.claude/agents/`, adaptés à la stack du projet (non commités).
- Difficulté : la session en cours ne les chargeait pas (liste des agents fixée au démarrage). Ils seront disponibles dans une nouvelle session ouverte dans ce dossier.

## À faire (prochaine session)
1. Confirmation, dans le style de l'application, quand on désactive le rappel ou qu'on supprime le médicament.
2. Action « Pris » directement dans la notification (sans ouvrir l'application).

## État du dépôt
- Branche `master`, dernier commit : « Messages de notification de plus en plus insultants ».
- Non commités : `.claude/` (agents) et ce fichier.
