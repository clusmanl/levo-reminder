<template>
  <ion-list lines="none" class="form">
    <ion-item>
      <ion-input
        v-model="draft.name"
        :label="t.form.medication"
        label-placement="floating"
        fill="outline"
        :placeholder="t.form.placeholder"
        :maxlength="40"
      />
    </ion-item>

    <ion-item>
      <ion-input v-model="draft.time" type="time" :label="t.form.time" label-placement="floating" fill="outline" />
    </ion-item>

    <ion-item>
      <ion-select
        :value="draft.frequency.kind"
        :label="t.form.frequency"
        label-placement="floating"
        fill="outline"
        interface="popover"
        @ion-change="setKind($event.detail.value)"
      >
        <ion-select-option value="daily">{{ t.form.optionDaily }}</ion-select-option>
        <ion-select-option value="weekdays">{{ t.form.optionWeekdays }}</ion-select-option>
        <ion-select-option value="interval">{{ t.form.optionInterval }}</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item v-if="draft.frequency.kind === 'weekdays'">
      <div class="chips">
        <ion-chip
          v-for="d in WEEKDAY_ORDER"
          :key="d"
          :outline="!draft.frequency.days.includes(d)"
          :color="draft.frequency.days.includes(d) ? 'primary' : 'medium'"
          @click="toggleDay(d)"
        >
          {{ t.frequency.weekdaysShort[d] }}
        </ion-chip>
      </div>
    </ion-item>

    <ion-item v-if="draft.frequency.kind === 'interval'">
      <ion-input
        :value="draft.frequency.everyDays"
        type="number"
        min="1"
        max="365"
        :label="t.form.everyDaysLabel"
        label-placement="floating"
        fill="outline"
        @ion-input="setEveryDays($event.detail.value)"
      />
    </ion-item>

    <ion-item>
      <ion-range
        class=""
        v-model="draft.maxRepeats"
        :min="0"
        :max="MAX_REPEATS"
        :step="1"
        :snaps="true"
        :pin="true"
        label-placement="stacked"
        :label="t.form.repeats(draft.maxRepeats)"
      />
    </ion-item>

    <ion-item v-if="draft.maxRepeats > 0">
      <ion-select v-model="draft.repeatIntervalMin" :label="t.form.repeatDelay" label-placement="floating" fill="outline" interface="popover">
        <ion-select-option v-for="m in REPEAT_INTERVAL_CHOICES" :key="m" :value="m">
          {{ t.form.minutes(m) }}
        </ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item v-if="showEnabled">
      <ion-toggle :checked="draft.enabled" @ion-change="setEnabled($event)">{{ t.form.enabled }}</ion-toggle>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import {
  IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonChip, IonRange, IonToggle,
  alertController,
} from '@ionic/vue';
import {
  MAX_REPEATS, REPEAT_INTERVAL_CHOICES, WEEKDAY_ORDER,
  clone, dateKey, type MedicationDraft,
} from '@/models/medication';
import { t } from '@/i18n';

const props = defineProps<{ modelValue: MedicationDraft; showEnabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [MedicationDraft] }>();

const draft = reactive<MedicationDraft>(clone(props.modelValue));

watch(draft, () => emit('update:modelValue', clone(draft)), { deep: true });

// Le parent peut modifier le brouillon (ex. renommage depuis le titre de la page).
watch(
  () => props.modelValue,
  (value) => {
    if (JSON.stringify(value) !== JSON.stringify(draft)) Object.assign(draft, clone(value));
  },
);

let confirming = false;

async function setEnabled(event: CustomEvent<{ checked: boolean }>) {
  const checked = event.detail.checked;
  if (checked === draft.enabled || confirming) return;
  if (checked) {
    draft.enabled = true;
    return;
  }
  // Désactiver coupe toutes les notifications : on demande confirmation.
  const toggle = event.target as HTMLIonToggleElement;
  toggle.checked = true; // reste activé tant que l'utilisateur n'a pas confirmé
  confirming = true;
  const alert = await alertController.create({
    header: t.form.disableHeader,
    message: t.form.disableMessage,
    buttons: [
      { text: t.common.cancel, role: 'cancel' },
      {
        text: t.form.disable, role: 'destructive',
        handler: () => { draft.enabled = false; toggle.checked = false; },
      },
    ],
  });
  alert.onDidDismiss().then(() => { confirming = false; });
  await alert.present();
}

function setKind(kind: MedicationDraft['frequency']['kind']) {
  if (kind === draft.frequency.kind) return;
  if (kind === 'daily') draft.frequency = { kind };
  else if (kind === 'weekdays') draft.frequency = { kind, days: [1, 2, 3, 4, 5] };
  else draft.frequency = { kind, everyDays: 2, startDate: dateKey() };
}

function toggleDay(d: number) {
  if (draft.frequency.kind !== 'weekdays') return;
  const days = draft.frequency.days;
  draft.frequency.days = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
}

function setEveryDays(v: string | number | null | undefined) {
  if (draft.frequency.kind !== 'interval') return;
  const n = Math.round(Number(v));
  if (n >= 1) draft.frequency.everyDays = Math.min(n, 365);
}
</script>

<style scoped>
.chips { display: flex; flex-wrap: wrap; padding: 8px 0; }
</style>
