# Levo Reminder

Application Android de rappels de prise de médicaments. Ionic 8, Vue 3, Capacitor.

## Fonctionnalités

- Ajout et suppression de rappels ; une page générique par médicament, renommable en touchant son titre
- Fréquence : tous les jours, certains jours de la semaine, ou tous les N jours
- Notification locale à l'heure choisie ; un clic ouvre la page du médicament
- Relances si la notification est ignorée (nombre et délai réglables par médicament), avec des messages de plus en plus insistants
- Coche : enregistre la prise ; croix : ignore le rappel. Les relances du jour s'arrêtent dans les deux cas
- Calendrier de suivi (pris / ignoré / oublié), modifiable en touchant un jour

Les données sont stockées localement sur l'appareil.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement (navigateur ; les notifications ne fonctionnent que sur Android) |
| `npm run build` | Vérification des types et build de production |
| `npm run test:unit` | Tests unitaires (Vitest) |
| `npm run lint` | ESLint |
| `npm run icons` | Régénère le logo (PNG, favicon, icônes Android et icône de notification) à partir de `resources/` |
| `npx cap sync android` | Copie le build web dans le projet Android |
| `npx cap open android` | Ouvre le projet dans Android Studio (JDK 17+ et Android SDK requis) |

## Architecture

- `src/models/medication.ts` : types, dates, fréquences
- `src/services/repository.ts` : stockage derrière l'interface `MedicationRepository` (point d'extension pour une synchronisation cloud)
- `src/services/notifications.ts` : planification sur une fenêtre glissante de 14 jours, replanifiée à chaque ouverture
- `src/services/notificationMessages.ts` : messages de notification (30 par niveau d'insistance, de plus en plus insultants, tirés au hasard)
- `src/stores/medications.ts` : état et actions
- `src/theme/` : `variables.css` (jetons de couleur) et `overrides.css` (surcharges des composants Ionic)
- `src/views/`, `src/components/` : interface
- `resources/` : sources du logo (SVG) et icône de notification Android ; `scripts/generate-icons.mjs` produit les icônes
- `tests/unit/` : tests unitaires
