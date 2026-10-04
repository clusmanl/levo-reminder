# Levo Reminder

Application Android de rappels de prise de médicaments. Ionic 8, Vue 3, Capacitor.

## Fonctionnalités

- Ajout et suppression de rappels ; une page générique par médicament
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
| `npx cap sync android` | Copie le build web dans le projet Android |
| `npx cap open android` | Ouvre le projet dans Android Studio (JDK 17+ et Android SDK requis) |

## Architecture

- `src/models/medication.ts` : types, dates, fréquences
- `src/services/repository.ts` : stockage derrière l'interface `MedicationRepository` (point d'extension pour une synchronisation cloud)
- `src/services/notifications.ts` : planification sur une fenêtre glissante de 14 jours, replanifiée à chaque ouverture, et messages de relance
- `src/stores/medications.ts` : état et actions
- `src/views/`, `src/components/` : interface
- `tests/unit/` : tests unitaires
