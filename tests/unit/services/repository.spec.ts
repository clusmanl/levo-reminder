import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: store.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => void store.set(key, value),
  },
}));

import { LocalRepository, type AppData } from '@/services/repository';

const KEY = 'levo-reminder-data';

describe('LocalRepository', () => {
  beforeEach(() => store.clear());

  it('renvoie des données vides au premier lancement', async () => {
    expect(await new LocalRepository().load()).toEqual({ version: 1, nextNumId: 1, medications: [] });
  });

  it("relit ce qu'il a sauvegardé", async () => {
    const repo = new LocalRepository();
    const data: AppData = { version: 1, nextNumId: 4, medications: [] };
    await repo.save(data);
    expect(await repo.load()).toEqual(data);
  });

  it('repart de zéro si les données stockées sont corrompues', async () => {
    store.set(KEY, '{pas du json');
    expect(await new LocalRepository().load()).toEqual({ version: 1, nextNumId: 1, medications: [] });
  });
});
