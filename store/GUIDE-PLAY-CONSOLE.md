# Guide Play Console : réponses étape par étape

Réponses pour chaque tâche de « Terminer la configuration de votre appli », dans l'ordre de la Play Console. Les libellés exacts peuvent varier légèrement.

**Fil conducteur** : l'appli ne collecte rien, n'a ni compte, ni publicité, ni réseau ; elle contient en revanche du **langage grossier** (les relances), ce qui oriente la classification et le public cible.

---

## 1. Définir les règles de confidentialité

1. Remplacer `VOTRE_EMAIL` (deux fois) dans `docs/privacy-policy.html` par l'adresse de contact de votre choix.
2. Publier la page à une URL publique. Le plus simple, avec GitHub Pages :
   - Dépôt `clusmanl/levo-reminder` sur GitHub > **Settings > Pages** > Source : **Deploy from a branch**, branche `master`, dossier `/docs`.
   - URL obtenue : `https://clusmanl.github.io/levo-reminder/privacy-policy.html`.
   - GitHub Pages sur un dépôt privé demande un abonnement payant. Si le dépôt est privé, publier la page ailleurs (Google Sites, etc.).
3. Coller l'URL dans la Play Console et enregistrer.

## 2. Informations de connexion (accès à l'appli)

- Choisir **« Toutes les fonctionnalités de mon appli sont disponibles sans restrictions d'accès »**.

## 3. Annonces

- **« Non, mon appli ne contient pas d'annonces »**.

## 4. Classification du contenu

1. Adresse e-mail de contact : celle de votre choix.
2. Catégorie : **« Toutes les autres types d'applis »** (ce n'est ni un jeu, ni un réseau social).
3. Réponses au questionnaire :

| Question | Réponse |
|---|---|
| Violence | Non |
| Peur / horreur | Non |
| Sexualité, nudité | Non |
| **Langage grossier / jurons** | **Oui** : les relances contiennent des grossièretés et des insultes (« shit », « asshole », « connard »…) |
| Substances contrôlées (drogues, alcool, tabac) | Non : l'appli rappelle des médicaments prescrits, elle ne fait pas la promotion de substances |
| Jeux d'argent | Non |
| Les utilisateurs peuvent-ils interagir ou échanger du contenu ? | Non |
| Partage de la position | Non |
| Achats numériques | Non |
| Contenu généré par les utilisateurs partagé | Non |

Répondre honnêtement « Oui » au langage grossier est important : une classification fausse peut faire retirer l'appli. Attendez-vous à une classification de type PEGI 12 à 16 selon le détail des réponses.

## 5. Cible (public cible et contenu)

- Tranche d'âge : **18 ans et plus uniquement**. Avec le langage grossier, viser les mineurs est déconseillé et déclencherait les règles « Familles », beaucoup plus strictes.
- « L'appli pourrait-elle attirer involontairement des enfants ? » : **Non**.

## 6. Sécurité des données

| Question | Réponse |
|---|---|
| L'appli collecte-t-elle ou partage-t-elle des données utilisateur des types requis ? | **Non** |

Pourquoi « Non » est juste : pour Google, une donnée est « collectée » quand elle quitte l'appareil. Levo Reminder n'envoie rien : pas de serveur, pas de statistiques, pas de publicité.

Une seule nuance : `android:allowBackup="true"` laisse Android inclure les données dans la sauvegarde Google de l'utilisateur. C'est une fonction du système, pas une collecte par vous, et la politique de confidentialité la mentionne. Si vous préférez une réponse « Non » sans aucune nuance, passez `allowBackup` à `false` dans `android/app/src/main/AndroidManifest.xml`, au prix de la perte des données lors d'un changement de téléphone.

Si la Console demande des précisions complémentaires :
- Chiffrement en transit : sans objet (aucune donnée transmise).
- Suppression des données : les données sont supprimées à la désinstallation, et chaque médicament peut être supprimé dans l'appli.

## 7. Applis gouvernementales

- **Non**, l'appli n'est pas développée par ou pour un organisme gouvernemental.

## 8. Fonctionnalités financières

- Cocher **« Mon appli ne propose aucune fonctionnalité financière »**.

## 9. Santé

- Cocher la fonctionnalité **« Gestion des médicaments et des traitements »** (ou son équivalent : rappels de médicaments, suivi de traitement).
- Ne rien cocher d'autre (pas de diagnostic, pas de dispositif médical, pas d'essais cliniques, pas de connexion à un objet de santé).
- Si on vous demande si l'appli est un dispositif médical réglementé : **Non**. La fiche et la politique de confidentialité précisent qu'elle ne remplace pas un avis médical.

## 10. Catégorie et coordonnées

- Type d'appli : **Appli**.
- Catégorie : **Médecine**. Les applis de rappel de médicaments y sont rangées. « Santé et remise en forme » est possible, mais vise plutôt le sport et le bien-être.
- Tags : choisir ceux qui parlent de rappels ou de médicaments si la liste en propose.
- Adresse e-mail : **obligatoire** et affichée publiquement sur la fiche. Utilisez éventuellement une adresse dédiée.
- Site web et téléphone : facultatifs.

## 11. Configurer une fiche Play Store

Tous les textes sont prêts dans `store/fiche-play-store.md` (français et anglais).

Visuels :
- Icône : `store/graphics/icon-512.png`.
- Image de présentation : `store/graphics/feature-graphic-fr.png` (et `feature-graphic-en.png` pour la fiche anglaise).
- Captures d'écran : **2 minimum**, format portrait. À prendre sur le téléphone avec quelques médicaments d'exemple :
  1. l'accueil avec 2 ou 3 médicaments ;
  2. la page d'un médicament (prise du jour et calendrier) ;
  3. le formulaire de réglages ;
  4. une notification de relance (la plus parlante pour présenter le concept).

  Téléphone branché en USB, une capture se récupère avec :
  ```
  "D:/Android/SDK/platform-tools/adb.exe" exec-out screencap -p > store/graphics/capture-1.png
  ```

---

## Après la configuration : envoyer la version

1. **Tests > Tests internes** (ou **Tests fermés** si votre compte personnel l'exige : 12 testeurs pendant 14 jours) > **Créer une version**.
2. Accepter **Play App Signing**.
3. Envoyer `android/app/release/app-release.aab` (version 1.1.0, code 2).
4. Notes de version :
   - FR : « Première version : rappels de médicaments, relances insistantes, bouton "Pris" dans la notification, interface en français et en anglais. »
   - EN : « First release: medication reminders, pushy follow-ups, "Taken" button in the notification, English and French interface. »
5. Après l'envoi, la Console ajoute une tâche **Autorisations > Alarmes exactes** (`SCHEDULE_EXACT_ALARM`). Réponse : l'appli est un **rappel de prise de médicaments** dont l'utilité repose sur des notifications à l'heure précise choisie par l'utilisateur.
6. Une fois les tests terminés : **Production > Créer une version**, en reprenant le même `.aab`.
