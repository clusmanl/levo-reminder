import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newDraft, type Medication } from '@/models/medication';
import { setLocale } from '@/i18n';
import { MESSAGES } from '@/services/notificationMessages';

const native = vi.hoisted(() => ({ value: true }));
const LocalNotifications = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  checkExactNotificationSetting: vi.fn(),
  changeExactNotificationSetting: vi.fn(),
  getPending: vi.fn(),
  cancel: vi.fn(),
  getDeliveredNotifications: vi.fn(),
  removeDeliveredNotifications: vi.fn(),
  schedule: vi.fn(),
  createChannel: vi.fn(),
  registerActionTypes: vi.fn(),
  addListener: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.value } }));
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn() } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications }));

import {
  cancelForMedication,
  ensurePermissions,
  initNotifications,
  messageFor,
  notificationId,
  scheduleForMedication,
} from '@/services/notifications';

function makeMed(overrides: Partial<Medication> = {}): Medication {
  return {
    ...newDraft(),
    id: 'med-1',
    numId: 7,
    name: 'Lévo',
    createdAt: '2026-10-01T00:00:00Z',
    log: {},
    ...overrides,
  };
}

const scheduled = () =>
  (LocalNotifications.schedule.mock.calls[0]?.[0].notifications ?? []) as Array<{
    id: number;
    title: string;
    schedule: { at: Date };
    actionTypeId?: string;
    extra: { medId: string; date: string; level: number };
  }>;

beforeEach(() => {
  native.value = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 3, 8, 0)); // 3 oct. 2026, 08:00 (heure locale)
  Object.values(LocalNotifications).forEach((fn) => fn.mockReset());
  LocalNotifications.getPending.mockResolvedValue({ notifications: [] });
  LocalNotifications.getDeliveredNotifications.mockResolvedValue({ notifications: [] });
});

afterEach(() => vi.useRealTimers());

describe('messageFor', () => {
  it('remplace {name} dans le titre et le corps', () => {
    for (let level = 0; level < MESSAGES.fr.length; level++) {
      for (const r of [0, 0.5, 0.999]) {
        const { title, body } = messageFor('Lévo', level, () => r);
        expect(`${title} ${body}`).not.toContain('{name}');
      }
    }
  });

  it('choisit le message selon le tirage aléatoire, dans le niveau demandé', () => {
    const first = messageFor('X', 2, () => 0);
    const last = messageFor('X', 2, () => 0.999);
    expect(first.title).toBe(MESSAGES.fr[2][0][0].replaceAll('{name}', 'X'));
    expect(last.title).toBe(MESSAGES.fr[2][29][0].replaceAll('{name}', 'X'));
  });

  it('reste sur le dernier niveau au-delà, et sur le premier en dessous de 0', () => {
    const lastLevel = MESSAGES.fr.length - 1;
    expect(messageFor('X', 99, () => 0.3)).toEqual(messageFor('X', lastLevel, () => 0.3));
    expect(messageFor('X', -1, () => 0.3)).toEqual(messageFor('X', 0, () => 0.3));
  });
});

describe('messageFor en anglais', () => {
  it('pioche dans le jeu anglais selon la locale', () => {
    setLocale('en');
    const { title } = messageFor('X', 2, () => 0);
    expect(title).toBe(MESSAGES.en[2][0][0].replaceAll('{name}', 'X'));
    expect(title).not.toBe(MESSAGES.fr[2][0][0].replaceAll('{name}', 'X'));
  });
});

describe('notificationId', () => {
  it('est unique par médicament, jour et niveau, et reste un int32', () => {
    const ids = new Set<number>();
    for (const numId of [1, 2, 20000]) {
      for (let day = 0; day < 14; day++) {
        for (let level = 0; level <= 10; level++) ids.add(notificationId(numId, day, level));
      }
    }
    expect(ids.size).toBe(3 * 14 * 11);
    expect(Math.max(...ids)).toBeLessThan(2 ** 31);
  });
});

describe('scheduleForMedication', () => {
  it('ne fait rien hors plateforme native', async () => {
    native.value = false;
    await scheduleForMedication(makeMed());
    expect(LocalNotifications.getPending).not.toHaveBeenCalled();
    expect(LocalNotifications.schedule).not.toHaveBeenCalled();
  });

  it('planifie rappel + relances, sur 14 jours, aux bonnes heures', async () => {
    await scheduleForMedication(makeMed({ time: '10:00', maxRepeats: 2, repeatIntervalMin: 15 }));
    const list = scheduled();
    expect(list).toHaveLength(14 * 3);

    const today = list.filter((n) => n.extra.date === '2026-10-03');
    expect(today.map((n) => [n.schedule.at.getHours(), n.schedule.at.getMinutes()])).toEqual([
      [10, 0],
      [10, 15],
      [10, 30],
    ]);
    expect(today.map((n) => n.extra.level)).toEqual([0, 1, 2]);
    expect(list.every((n) => n.extra.medId === 'med-1')).toBe(true);
  });

  it("saute les notifications déjà passées aujourd'hui", async () => {
    vi.setSystemTime(new Date(2026, 9, 3, 10, 20));
    await scheduleForMedication(makeMed({ time: '10:00', maxRepeats: 2, repeatIntervalMin: 15 }));
    const today = scheduled().filter((n) => n.extra.date === '2026-10-03');
    expect(today.map((n) => n.extra.level)).toEqual([2]); // seule la relance de 10:30 reste
  });

  it("n'envoie rien pour un jour déjà pris ou ignoré", async () => {
    const log = {
      '2026-10-03': { status: 'taken' as const, at: '2026-10-03T07:00:00Z' },
      '2026-10-04': { status: 'skipped' as const, at: '2026-10-03T07:00:00Z' },
    };
    await scheduleForMedication(makeMed({ maxRepeats: 0, log }));
    const dates = scheduled().map((n) => n.extra.date);
    expect(dates).not.toContain('2026-10-03');
    expect(dates).not.toContain('2026-10-04');
    expect(dates).toHaveLength(12);
  });

  it('respecte la fréquence', async () => {
    await scheduleForMedication(makeMed({ maxRepeats: 0, frequency: { kind: 'weekdays', days: [1] } }));
    const dates = scheduled().map((n) => n.extra.date);
    expect(dates).toEqual(['2026-10-05', '2026-10-12']); // lundis dans la fenêtre
  });

  it("annule l'existant avant de replanifier, et ne planifie rien si désactivé", async () => {
    LocalNotifications.getPending.mockResolvedValue({
      notifications: [{ id: notificationId(7, 0, 0) }, { id: notificationId(8, 0, 0) }],
    });
    await scheduleForMedication(makeMed({ enabled: false }));
    expect(LocalNotifications.cancel).toHaveBeenCalledWith({
      notifications: [{ id: notificationId(7, 0, 0) }], // pas celui du médicament n°8
    });
    expect(LocalNotifications.schedule).not.toHaveBeenCalled();
  });
});

describe('cancelForMedication', () => {
  it('retire aussi les notifications déjà affichées pour ce médicament', async () => {
    const mine = { id: 1, extra: { medId: 'med-1' } };
    const other = { id: 2, extra: { medId: 'autre' } };
    LocalNotifications.getDeliveredNotifications.mockResolvedValue({ notifications: [mine, other] });
    await cancelForMedication({ id: 'med-1', numId: 7 });
    expect(LocalNotifications.removeDeliveredNotifications).toHaveBeenCalledWith({ notifications: [mine] });
  });
});

describe('actions de notification', () => {
  type Listener = (event: { actionId: string; notification: { extra?: Record<string, unknown> } }) => void;

  async function init() {
    const onOpen = vi.fn();
    const onResume = vi.fn();
    const onTaken = vi.fn();
    await initNotifications(onOpen, onResume, onTaken);
    const call = LocalNotifications.addListener.mock.calls.find(
      ([name]) => name === 'localNotificationActionPerformed',
    );
    return { onOpen, onTaken, listener: call?.[1] as Listener };
  }

  it("enregistre un type d'action contenant l'action « taken »", async () => {
    await init();
    expect(LocalNotifications.registerActionTypes).toHaveBeenCalledTimes(1);
    const { types } = LocalNotifications.registerActionTypes.mock.calls[0][0];
    expect(types).toHaveLength(1);
    expect(types[0].actions.map((a: { id: string }) => a.id)).toContain('taken');
  });

  it("n'enregistre rien hors plateforme native", async () => {
    native.value = false;
    await initNotifications(vi.fn(), vi.fn(), vi.fn());
    expect(LocalNotifications.registerActionTypes).not.toHaveBeenCalled();
  });

  it("chaque notification planifiée porte l'actionTypeId enregistré", async () => {
    await init();
    const [{ types }] = LocalNotifications.registerActionTypes.mock.calls[0];
    await scheduleForMedication(makeMed({ maxRepeats: 1 }));
    const list = scheduled();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((n) => n.actionTypeId === types[0].id)).toBe(true);
  });

  it("l'action « taken » appelle onTaken(medId, date) sans appeler onOpen", async () => {
    const { listener, onOpen, onTaken } = await init();
    listener({ actionId: 'taken', notification: { extra: { medId: 'med-1', date: '2026-10-03' } } });
    expect(onTaken).toHaveBeenCalledWith('med-1', '2026-10-03');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('un clic simple appelle onOpen(medId) sans appeler onTaken', async () => {
    const { listener, onOpen, onTaken } = await init();
    listener({ actionId: 'tap', notification: { extra: { medId: 'med-1', date: '2026-10-03' } } });
    expect(onOpen).toHaveBeenCalledWith('med-1');
    expect(onTaken).not.toHaveBeenCalled();
  });
});

describe('ensurePermissions', () => {
  it('renvoie false hors plateforme native', async () => {
    native.value = false;
    expect(await ensurePermissions()).toBe(false);
  });

  it("demande la permission puis l'alarme exacte si nécessaire", async () => {
    LocalNotifications.checkPermissions.mockResolvedValue({ display: 'prompt' });
    LocalNotifications.requestPermissions.mockResolvedValue({ display: 'granted' });
    LocalNotifications.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'denied' });
    expect(await ensurePermissions()).toBe(true);
    expect(LocalNotifications.changeExactNotificationSetting).toHaveBeenCalled();
  });

  it("s'arrête si la permission est refusée", async () => {
    LocalNotifications.checkPermissions.mockResolvedValue({ display: 'denied' });
    LocalNotifications.requestPermissions.mockResolvedValue({ display: 'denied' });
    expect(await ensurePermissions()).toBe(false);
    expect(LocalNotifications.checkExactNotificationSetting).not.toHaveBeenCalled();
  });
});
