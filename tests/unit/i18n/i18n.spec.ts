import { describe, expect, it } from 'vitest';
import { dateLocale, detectLocale, locale, setLocale, t } from '@/i18n';
import { fr } from '@/i18n/fr';
import { en } from '@/i18n/en';
import { describeFrequency } from '@/models/medication';

/** Liste les chemins des clés d'un dictionnaire (les fonctions et tableaux sont des feuilles). */
function paths(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? paths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('detectLocale', () => {
  it('choisit le français pour toute langue commençant par fr', () => {
    for (const lang of ['fr', 'fr-FR', 'fr-CA', 'FR-be']) expect(detectLocale(lang)).toBe('fr');
  });

  it('choisit l\'anglais pour les autres langues ou en l\'absence de langue', () => {
    for (const lang of ['en-US', 'de-DE', 'es', '', undefined]) expect(detectLocale(lang)).toBe('en');
  });
});

describe('setLocale', () => {
  it('met à jour locale, dateLocale et les messages', () => {
    setLocale('en');
    expect(locale).toBe('en');
    expect(dateLocale).toBe('en-US');
    expect(t.frequency.daily).toBe('Every day');
    expect(document.documentElement.lang).toBe('en');

    setLocale('fr');
    expect(locale).toBe('fr');
    expect(dateLocale).toBe('fr-FR');
    expect(t.frequency.daily).toBe('Tous les jours');
  });
});

describe('dictionnaires', () => {
  it('ont les mêmes clés en français et en anglais', () => {
    expect(paths(en).sort()).toEqual(paths(fr).sort());
  });

  it('ont 7 initiales de jours et 7 abréviations de jours', () => {
    for (const m of [fr, en]) {
      expect(m.calendar.weekdayInitials).toHaveLength(7);
      expect(m.frequency.weekdaysShort).toHaveLength(7);
    }
  });
});

describe('describeFrequency en anglais', () => {
  it('décrit chaque fréquence', () => {
    setLocale('en');
    expect(describeFrequency({ kind: 'daily' })).toBe('Every day');
    expect(describeFrequency({ kind: 'interval', everyDays: 1, startDate: '2026-01-01' })).toBe('Every day');
    expect(describeFrequency({ kind: 'interval', everyDays: 3, startDate: '2026-01-01' })).toBe('Every 3 days');
    expect(describeFrequency({ kind: 'weekdays', days: [0, 5, 1] })).toBe('Mon, Fri, Sun');
    expect(describeFrequency({ kind: 'weekdays', days: [] })).toBe('No day');
  });
});
