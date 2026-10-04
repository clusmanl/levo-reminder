export type Frequency =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] } // 0 = dimanche … 6 = samedi (Date#getDay)
  | { kind: 'interval'; everyDays: number; startDate: string };

export type IntakeStatus = 'taken' | 'skipped';

export interface IntakeEntry {
  status: IntakeStatus;
  at: string;
}

export interface Medication {
  id: string;
  numId: number;
  name: string;
  time: string; // HH:mm
  frequency: Frequency;
  maxRepeats: number;
  repeatIntervalMin: number;
  enabled: boolean;
  createdAt: string;
  log: Record<string, IntakeEntry>;
}

export type MedicationDraft = Pick<
  Medication,
  'name' | 'time' | 'frequency' | 'maxRepeats' | 'repeatIntervalMin' | 'enabled'
>;

export const MAX_REPEATS = 10;
export const REPEAT_INTERVAL_CHOICES = [5, 10, 15, 30, 60];

export function newDraft(): MedicationDraft {
  return {
    name: '',
    time: '10:00',
    frequency: { kind: 'daily' },
    maxRepeats: 3,
    repeatIntervalMin: 15,
    enabled: true,
  };
}

/* ---------- dates ---------- */

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = parseDateKey(fromKey).getTime();
  const b = parseDateKey(toKey).getTime();
  return Math.round((b - a) / 86_400_000);
}

/* ---------- fréquence ---------- */

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function isDue(med: Medication, key: string): boolean {
  const f = med.frequency;
  switch (f.kind) {
    case 'daily':
      return true;
    case 'weekdays':
      return f.days.includes(parseDateKey(key).getDay());
    case 'interval': {
      const diff = daysBetween(f.startDate, key);
      return diff >= 0 && diff % Math.max(1, f.everyDays) === 0;
    }
  }
}

export function describeFrequency(f: Frequency): string {
  switch (f.kind) {
    case 'daily':
      return 'Tous les jours';
    case 'weekdays':
      return f.days.length
        ? WEEKDAY_ORDER.filter((d) => f.days.includes(d)).map((d) => WEEKDAY_SHORT[d]).join(', ')
        : 'Aucun jour';
    case 'interval':
      return f.everyDays === 1 ? 'Tous les jours' : `Tous les ${f.everyDays} jours`;
  }
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
