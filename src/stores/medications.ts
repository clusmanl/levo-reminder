import { computed, ref } from 'vue';
import {
  clone,
  dateKey,
  type IntakeStatus,
  type Medication,
  type MedicationDraft,
} from '@/models/medication';
import { LocalRepository, type MedicationRepository } from '@/services/repository';
import {
  cancelForMedication,
  ensurePermissions,
  scheduleAll,
  scheduleForMedication,
} from '@/services/notifications';

// Pour le cloud plus tard : remplacer par une autre implémentation.
const repository: MedicationRepository = new LocalRepository();

const medications = ref<Medication[]>([]);
let nextNumId = 1;
let ready = false;

async function persist() {
  await repository.save({ version: 1, nextNumId, medications: medications.value });
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useMedications() {
  async function init() {
    if (ready) return;
    const data = await repository.load();
    medications.value = data.medications;
    nextNumId = data.nextNumId;
    ready = true;
    await scheduleAll(medications.value);
  }

  function get(id: string): Medication | undefined {
    return medications.value.find((m) => m.id === id);
  }

  async function add(draft: MedicationDraft): Promise<Medication> {
    const med: Medication = {
      ...clone(draft),
      id: newId(),
      numId: nextNumId++,
      createdAt: new Date().toISOString(),
      log: {},
    };
    medications.value.push(med);
    await persist();
    await ensurePermissions();
    await scheduleForMedication(med);
    return med;
  }

  async function update(id: string, draft: MedicationDraft) {
    const med = get(id);
    if (!med) return;
    Object.assign(med, clone(draft));
    await persist();
    await scheduleForMedication(med);
  }

  async function remove(id: string) {
    const med = get(id);
    if (!med) return;
    await cancelForMedication(med);
    medications.value = medications.value.filter((m) => m.id !== id);
    await persist();
  }

  /** status = null efface l'enregistrement du jour. */
  async function setIntake(id: string, day: string, status: IntakeStatus | null) {
    const med = get(id);
    if (!med) return;
    if (status) med.log[day] = { status, at: new Date().toISOString() };
    else delete med.log[day];
    await persist();
    await scheduleForMedication(med);
  }

  return {
    medications: computed(() => medications.value),
    init,
    rescheduleAll: () => scheduleAll(medications.value),
    get,
    add,
    update,
    remove,
    setIntake,
    today: dateKey,
  };
}
