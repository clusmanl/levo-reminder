import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addDays, dateKey, isDue, type Medication } from '@/models/medication';
import { MESSAGES } from './notificationMessages';

const CHANNEL_ID = 'levo-reminders';
/** Nombre de jours planifiés à l'avance (re-planifié à chaque ouverture de l'app). */
const WINDOW_DAYS = 14;
const ID_MED = 100_000;
const ID_DAY = 100;

const native = () => Capacitor.isNativePlatform();

/* ---------- messages de plus en plus insistants ---------- */

/** Tire au hasard un message du niveau d'insistance donné (borné au dernier niveau). */
export function messageFor(
  name: string,
  level: number,
  random: () => number = Math.random,
): { title: string; body: string } {
  const pool = MESSAGES[Math.min(Math.max(level, 0), MESSAGES.length - 1)];
  const [title, body] = pool[Math.floor(random() * pool.length)];
  const fill = (text: string) => text.replaceAll('{name}', name);
  return { title: fill(title), body: fill(body) };
}

/* ---------- API ---------- */

export function notificationId(numId: number, dayOffset: number, level: number): number {
  return numId * ID_MED + dayOffset * ID_DAY + level;
}

export async function ensurePermissions(): Promise<boolean> {
  if (!native()) return false;
  let { display } = await LocalNotifications.checkPermissions();
  if (display !== 'granted') {
    ({ display } = await LocalNotifications.requestPermissions());
  }
  if (display !== 'granted') return false;

  // Android 12+ : les alarmes exactes demandent une autorisation à part.
  try {
    const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
    if (exact_alarm !== 'granted') await LocalNotifications.changeExactNotificationSetting();
  } catch {
    /* non supporté sur cette version d'Android */
  }
  return true;
}

export async function initNotifications(onOpen: (medId: string) => void, onResume: () => void) {
  if (!native()) return;

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Rappels de médicaments',
    description: 'Rappels quotidiens et relances',
    importance: 5,
    visibility: 1,
    vibration: true,
  });

  await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const medId = event.notification.extra?.medId as string | undefined;
    if (medId) onOpen(medId);
  });

  await App.addListener('resume', onResume);
}

async function pendingIdsFor(numId: number): Promise<number[]> {
  const { notifications } = await LocalNotifications.getPending();
  return notifications.map((n) => n.id).filter((id) => Math.floor(id / ID_MED) === numId);
}

/** Annule les notifications à venir ET retire celles déjà affichées. */
export async function cancelForMedication(med: Pick<Medication, 'id' | 'numId'>) {
  if (!native()) return;
  const ids = await pendingIdsFor(med.numId);
  if (ids.length) await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });

  const { notifications } = await LocalNotifications.getDeliveredNotifications();
  const shown = notifications.filter((n) => n.extra?.medId === med.id);
  if (shown.length) await LocalNotifications.removeDeliveredNotifications({ notifications: shown });
}

/** Re-planifie toutes les notifications d'un médicament pour les prochains jours. */
export async function scheduleForMedication(med: Medication) {
  if (!native()) return;
  await cancelForMedication(med);
  if (!med.enabled) return;

  const now = Date.now();
  const [hh, mm] = med.time.split(':').map(Number);
  const today = new Date();
  const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

  for (let offset = 0; offset < WINDOW_DAYS; offset++) {
    const day = addDays(today, offset);
    const key = dateKey(day);
    if (!isDue(med, key) || med.log[key]) continue;

    for (let level = 0; level <= med.maxRepeats; level++) {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm + level * med.repeatIntervalMin);
      if (at.getTime() <= now) continue;
      const { title, body } = messageFor(med.name, level);
      notifications.push({
        id: notificationId(med.numId, offset, level),
        title,
        body,
        channelId: CHANNEL_ID,
        schedule: { at, allowWhileIdle: true },
        extra: { medId: med.id, date: key, level },
      });
    }
  }

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

export async function scheduleAll(meds: Medication[]) {
  for (const m of meds) await scheduleForMedication(m);
}
