import { fr, type Messages } from './fr';
import { en } from './en';

export type Locale = 'fr' | 'en';
export type { Messages };

const CATALOGS: Record<Locale, Messages> = { fr, en };
const DATE_LOCALES: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US' };

/** Langue d'après celle du navigateur / de l'appareil : français si elle commence par « fr », sinon anglais. */
export function detectLocale(language: string | undefined = globalThis.navigator?.language): Locale {
  return language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

/** Langue courante, détectée une fois au démarrage (modifiable via `setLocale`, surtout pour les tests). */
export let locale: Locale = detectLocale();
/** Locale à passer à toLocaleDateString / toLocaleTimeString. */
export let dateLocale: string = DATE_LOCALES[locale];

/** Messages de la langue courante : objet stable, mis à jour en place par `setLocale`. */
export const t: Messages = { ...CATALOGS[locale] };

export function setLocale(next: Locale) {
  locale = next;
  dateLocale = DATE_LOCALES[next];
  Object.assign(t, CATALOGS[next]);
  if (typeof document !== 'undefined') document.documentElement.lang = next;
}
