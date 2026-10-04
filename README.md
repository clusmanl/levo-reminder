# Levo Reminder

Rappels quotidiens de médicaments — Ionic + Vue 3 + Capacitor (Android).

## Fonctionnalités
- Ajout / suppression de rappels, une page générique par médicament
- Fréquence : tous les jours, certains jours de la semaine, ou tous les N jours
- Notification locale à l'heure choisie ; un clic ouvre la page du médicament
- Relances (nombre et délai réglables par médicament) avec des messages de plus en plus insistants
- ✓ enregistre la prise, ✗ ignore ; les relances du jour s'arrêtent
- Calendrier de suivi (pris / ignoré / oublié), modifiable en touchant un jour

## Développement
```
npm install
npm run dev            # navigateur (les notifications ne fonctionnent que sur Android)
npm run build && npx cap sync android
npx cap open android   # Android Studio
```
Prérequis pour l'APK : JDK 17+ et Android SDK (Android Studio).

## Architecture
- `src/models/medication.ts` — types, dates, fréquences
- `src/services/repository.ts` — stockage (local, via `MedicationRepository`) ; **point d'extension pour le cloud**
- `src/services/notifications.ts` — planification (fenêtre glissante de 14 jours, re-planifiée à chaque ouverture) et messages
- `src/stores/medications.ts` — état + actions
- `src/views/`, `src/components/` — UI
