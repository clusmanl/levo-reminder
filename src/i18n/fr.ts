/** Dictionnaire de référence (français). `en.ts` doit avoir exactement la même forme. */
export const fr = {
  common: {
    cancel: 'Annuler',
    delete: 'Supprimer',
  },
  home: {
    title: 'Levo Reminder',
    emptyLine1: "Aucun rappel pour l'instant.",
    emptyLine2: 'Appuie sur + pour ajouter un médicament.',
    disabled: 'Rappel désactivé',
    addAria: 'Ajouter un médicament',
    newTitle: 'Nouveau rappel',
    add: 'Ajouter',
    statusTaken: 'Pris',
    statusSkipped: 'Ignoré',
    statusOff: "Pas aujourd'hui",
    statusPending: 'À prendre',
    deleteHeader: 'Supprimer ce rappel ?',
    deleteMessage: (name: string) => `« ${name} » et tout son historique seront supprimés.`,
  },
  medication: {
    fallbackTitle: 'Médicament',
    nameAria: 'Nom du médicament',
    today: "Aujourd'hui",
    stateAt: (taken: boolean, time: string) => `${taken ? 'Pris' : 'Ignoré'} à ${time}`,
    notDueToday: "Pas de prise prévue aujourd'hui.",
    planned: (time: string, name: string) => `Prévu à ${time}. As-tu pris ${name} ?`,
    skipAria: 'Ignorer',
    takeAria: 'Pris',
    history: 'Historique',
    takenThisMonth: (n: number) => `${n} prise(s) ce mois-ci`,
    settings: 'Réglages',
    deleteButton: 'Supprimer ce rappel',
    notFound: "Ce médicament n'existe plus.",
    deleteHeader: 'Supprimer ce rappel ?',
    deleteMessage: 'Le médicament et tout son historique seront supprimés.',
    sheetTaken: 'Pris ✓',
    sheetSkipped: 'Ignoré ✗',
    sheetClear: 'Effacer',
  },
  form: {
    medication: 'Médicament',
    placeholder: 'ex. Lévothyrox',
    time: 'Heure du rappel',
    frequency: 'Fréquence',
    optionDaily: 'Tous les jours',
    optionWeekdays: 'Certains jours',
    optionInterval: 'Tous les N jours',
    everyDaysLabel: 'Tous les … jours',
    repeats: (n: number) => `Relance si ignoré : ${n}`,
    repeatDelay: 'Délai entre relances',
    minutes: (m: number) => `${m} min`,
    enabled: 'Rappel activé',
    disableHeader: 'Désactiver ce rappel ?',
    disableMessage: 'Tu ne recevras plus aucune notification pour ce médicament.',
    disable: 'Désactiver',
  },
  calendar: {
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    /** Initiales, du lundi au dimanche. */
    weekdayInitials: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    taken: 'Pris',
    skipped: 'Ignoré',
    missed: 'Oublié',
  },
  frequency: {
    daily: 'Tous les jours',
    noDay: 'Aucun jour',
    everyDays: (n: number) => `Tous les ${n} jours`,
    /** Indexé comme Date#getDay : dimanche en premier. */
    weekdaysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  },
  notifications: {
    channelName: 'Rappels de médicaments',
    channelDescription: 'Rappels quotidiens et relances',
    takenAction: 'Pris ✓',
  },
};

/** Forme commune à toutes les langues (les chaînes sont élargies à `string`). */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : T extends readonly string[]
      ? string[]
      : { [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof fr>;
