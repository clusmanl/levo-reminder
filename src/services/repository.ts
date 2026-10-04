import { Preferences } from '@capacitor/preferences';
import type { Medication } from '@/models/medication';

export interface AppData {
  version: 1;
  nextNumId: number;
  medications: Medication[];
}

export interface MedicationRepository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

const KEY = 'levo-reminder-data';

export class LocalRepository implements MedicationRepository {
  async load(): Promise<AppData> {
    const { value } = await Preferences.get({ key: KEY });
    if (value) {
      try {
        return JSON.parse(value) as AppData;
      } catch {
        /* données corrompues : on repart de zéro */
      }
    }
    return { version: 1, nextNumId: 1, medications: [] };
  }

  async save(data: AppData): Promise<void> {
    await Preferences.set({ key: KEY, value: JSON.stringify(data) });
  }
}
