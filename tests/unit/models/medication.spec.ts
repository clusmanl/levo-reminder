import { describe, expect, it } from 'vitest';
import {
  addDays,
  clone,
  dateKey,
  daysBetween,
  describeFrequency,
  isDue,
  newDraft,
  parseDateKey,
  type Frequency,
  type Medication,
} from '@/models/medication';

function medWith(frequency: Frequency): Medication {
  return { ...newDraft(), frequency, id: 'm1', numId: 1, createdAt: '2026-01-01T00:00:00Z', log: {} };
}

describe('dates', () => {
  it('dateKey formate en YYYY-MM-DD avec zéros', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it("parseDateKey est l'inverse de dateKey", () => {
    expect(dateKey(parseDateKey('2026-03-09'))).toBe('2026-03-09');
  });

  it("addDays gère les changements de mois et d'année sans muter l'entrée", () => {
    const start = new Date(2026, 11, 30);
    expect(dateKey(addDays(start, 3))).toBe('2027-01-02');
    expect(dateKey(addDays(start, -30))).toBe('2026-11-30');
    expect(dateKey(start)).toBe('2026-12-30');
  });

  it("daysBetween est signé et robuste au changement d'heure", () => {
    expect(daysBetween('2026-03-01', '2026-03-31')).toBe(30);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2); // passage à l'heure d'été en Europe
    expect(daysBetween('2026-05-10', '2026-05-08')).toBe(-2);
  });
});

describe('isDue', () => {
  it('daily : tous les jours', () => {
    const med = medWith({ kind: 'daily' });
    expect(isDue(med, '2026-10-03')).toBe(true);
    expect(isDue(med, '2026-10-04')).toBe(true);
  });

  it('weekdays : seulement les jours choisis (0 = dimanche)', () => {
    const med = medWith({ kind: 'weekdays', days: [1, 0] });
    expect(isDue(med, '2026-10-04')).toBe(true); // dimanche
    expect(isDue(med, '2026-10-05')).toBe(true); // lundi
    expect(isDue(med, '2026-10-06')).toBe(false); // mardi
  });

  it('weekdays : liste vide → jamais dû', () => {
    expect(isDue(medWith({ kind: 'weekdays', days: [] }), '2026-10-05')).toBe(false);
  });

  it('interval : tous les N jours à partir de la date de départ', () => {
    const med = medWith({ kind: 'interval', everyDays: 3, startDate: '2026-10-01' });
    expect(isDue(med, '2026-09-28')).toBe(false); // avant le départ
    expect(isDue(med, '2026-10-01')).toBe(true);
    expect(isDue(med, '2026-10-02')).toBe(false);
    expect(isDue(med, '2026-10-04')).toBe(true);
    expect(isDue(med, '2026-10-31')).toBe(true); // 30 jours plus tard
  });

  it('interval : un pas invalide (0) est traité comme 1', () => {
    const med = medWith({ kind: 'interval', everyDays: 0, startDate: '2026-10-01' });
    expect(isDue(med, '2026-10-02')).toBe(true);
  });
});

describe('describeFrequency', () => {
  it('décrit chaque fréquence', () => {
    expect(describeFrequency({ kind: 'daily' })).toBe('Tous les jours');
    expect(describeFrequency({ kind: 'interval', everyDays: 1, startDate: '2026-01-01' })).toBe('Tous les jours');
    expect(describeFrequency({ kind: 'interval', everyDays: 3, startDate: '2026-01-01' })).toBe('Tous les 3 jours');
  });

  it("weekdays : ordre lundi → dimanche, quel que soit l'ordre saisi", () => {
    expect(describeFrequency({ kind: 'weekdays', days: [0, 5, 1] })).toBe('Lun, Ven, Dim');
    expect(describeFrequency({ kind: 'weekdays', days: [] })).toBe('Aucun jour');
  });
});

describe('clone / newDraft', () => {
  it('clone produit une copie profonde indépendante', () => {
    const original = { a: { b: [1, 2] } };
    const copy = clone(original);
    copy.a.b.push(3);
    expect(original.a.b).toEqual([1, 2]);
  });

  it("newDraft renvoie des valeurs par défaut sans état partagé", () => {
    const a = newDraft();
    expect(a).toMatchObject({ name: '', time: '10:00', maxRepeats: 3, repeatIntervalMin: 15, enabled: true });
    a.frequency = { kind: 'weekdays', days: [1] };
    expect(newDraft().frequency).toEqual({ kind: 'daily' });
  });
});
