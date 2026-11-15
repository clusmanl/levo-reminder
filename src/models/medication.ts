import { t } from '@/i18n';

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
      return t.frequency.daily;
    case 'weekdays':
      return f.days.length
        ? WEEKDAY_ORDER.filter((d) => f.days.includes(d)).map((d) => t.frequency.weekdaysShort[d]).join(', ')
        : t.frequency.noDay;
    case 'interval':
      return f.everyDays === 1 ? t.frequency.daily : t.frequency.everyDays(f.everyDays);
  }
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Nouveau nom à enregistrer (sans espaces superflus), ou null s'il est vide ou inchangé. */
export function resolveRename(input: string, current: string): string | null {
  const name = input.trim();
  return name && name !== current ? name : null;
}
