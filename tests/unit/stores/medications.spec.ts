import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newDraft, type Medication } from '@/models/medication';

const repo = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
const notif = vi.hoisted(() => ({
  cancelForMedication: vi.fn(),
  ensurePermissions: vi.fn(),
  scheduleAll: vi.fn(),
  scheduleForMedication: vi.fn(),
}));

vi.mock('@/services/repository', () => ({ LocalRepository: class { load = repo.load; save = repo.save; } }));
vi.mock('@/services/notifications', () => notif);

// Le store est un singleton de module : on le recharge pour chaque test.
async function freshStore(initial: { nextNumId?: number; medications?: Medication[] } = {}) {
  vi.resetModules();
  repo.load.mockResolvedValue({ version: 1, nextNumId: 1, medications: [], ...initial });
  const { useMedications } = await import('@/stores/medications');
  const store = useMedications();
  await store.init();
  return store;
}

const draft = (name = 'Lévo') => ({ ...newDraft(), name });

beforeEach(() => {
  Object.values(repo).forEach((fn) => fn.mockReset());
  Object.values(notif).forEach((fn) => fn.mockReset());
  repo.save.mockResolvedValue(undefined);
});

describe('init', () => {
  it('charge les médicaments et replanifie les notifications', async () => {
    const existing = { ...newDraft(), name: 'A', id: 'a', numId: 1, createdAt: '', log: {} };
    const store = await freshStore({ nextNumId: 2, medications: [existing] });
    expect(store.medications.value.map((m) => m.id)).toEqual(['a']);
    expect(notif.scheduleAll).toHaveBeenCalledTimes(1);
  });
});

describe('add', () => {
  it('crée un médicament avec id, numId incrémenté et journal vide, puis persiste et planifie', async () => {
    const store = await freshStore({ nextNumId: 5 });
    const a = await store.add(draft('A'));
    const b = await store.add(draft('B'));

    expect(a.numId).toBe(5);
    expect(b.numId).toBe(6);
    expect(a.id).not.toBe(b.id);
    expect(a.log).toEqual({});
    expect(repo.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ nextNumId: 7, medications: expect.arrayContaining([a, b]) }),
    );
    expect(notif.ensurePermissions).toHaveBeenCalled();
    expect(notif.scheduleForMedication).toHaveBeenCalledWith(a);
  });

  it('ne partage pas la fréquence avec le brouillon', async () => {
    const store = await freshStore();
    const d = draft();
    const med = await store.add(d);
    d.frequency = { kind: 'weekdays', days: [1] };
    expect(med.frequency).toEqual({ kind: 'daily' });
  });
});

describe('update', () => {
  it('applique le brouillon, persiste et replanifie', async () => {
    const store = await freshStore();
    const med = await store.add(draft());
    notif.scheduleForMedication.mockClear();

    await store.update(med.id, { ...draft('Nouveau'), time: '07:30' });
    expect(store.get(med.id)).toMatchObject({ name: 'Nouveau', time: '07:30' });
    expect(notif.scheduleForMedication).toHaveBeenCalledWith(store.get(med.id));
  });

  it('ignore un id inconnu', async () => {
    const store = await freshStore();
    await store.update('inconnu', draft());
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe('remove', () => {
  it('annule les notifications puis supprime et persiste', async () => {
    const store = await freshStore();
    const med = await store.add(draft());
    await store.remove(med.id);
    expect(notif.cancelForMedication).toHaveBeenCalledWith(expect.objectContaining({ id: med.id }));
    expect(store.get(med.id)).toBeUndefined();
    expect(repo.save).toHaveBeenLastCalledWith(expect.objectContaining({ medications: [] }));
  });
});

describe('setIntake', () => {
  it('enregistre une prise, la remplace, puis l\'efface avec null', async () => {
    const store = await freshStore();
    const med = await store.add(draft());

    await store.setIntake(med.id, '2026-10-03', 'taken');
    expect(store.get(med.id)!.log['2026-10-03'].status).toBe('taken');

    await store.setIntake(med.id, '2026-10-03', 'skipped');
    expect(store.get(med.id)!.log['2026-10-03'].status).toBe('skipped');

    await store.setIntake(med.id, '2026-10-03', null);
    expect(store.get(med.id)!.log).toEqual({});
  });

  it('replanifie après chaque changement (pour stopper ou rétablir les relances)', async () => {
    const store = await freshStore();
    const med = await store.add(draft());
    notif.scheduleForMedication.mockClear();
    await store.setIntake(med.id, '2026-10-03', 'taken');
    expect(notif.scheduleForMedication).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalled();
  });
});
