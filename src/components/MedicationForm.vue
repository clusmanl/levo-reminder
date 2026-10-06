<template>
  <ion-list lines="none" class="form">
    <ion-item>
      <ion-input
        v-model="draft.name"
        label="Médicament"
        label-placement="floating"
        fill="outline"
        placeholder="ex. Lévothyrox"
        :maxlength="40"
      />
    </ion-item>

    <ion-item>
      <ion-input v-model="draft.time" type="time" label="Heure du rappel" label-placement="floating" fill="outline" />
    </ion-item>

    <ion-item>
      <ion-select
        :value="draft.frequency.kind"
        label="Fréquence"
        label-placement="floating"
        fill="outline"
        interface="popover"
        @ion-change="setKind($event.detail.value)"
      >
        <ion-select-option value="daily">Tous les jours</ion-select-option>
        <ion-select-option value="weekdays">Certains jours</ion-select-option>
        <ion-select-option value="interval">Tous les N jours</ion-select-option>
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
          {{ WEEKDAY_SHORT[d] }}
        </ion-chip>
      </div>
    </ion-item>

    <ion-item v-if="draft.frequency.kind === 'interval'">
      <ion-input
        :value="draft.frequency.everyDays"
        type="number"
        min="1"
        max="365"
        label="Tous les … jours"
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
        :label="`Relance si ignoré : ${draft.maxRepeats}`"
      />
    </ion-item>

    <ion-item v-if="draft.maxRepeats > 0">
      <ion-select v-model="draft.repeatIntervalMin" label="Délai entre relances" label-placement="floating" fill="outline" interface="popover">
        <ion-select-option v-for="m in REPEAT_INTERVAL_CHOICES" :key="m" :value="m">
          {{ m }} min
        </ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item v-if="showEnabled">
      <ion-toggle v-model="draft.enabled">Rappel activé</ion-toggle>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import {
  IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonChip, IonRange, IonToggle,
} from '@ionic/vue';
import {
  MAX_REPEATS, REPEAT_INTERVAL_CHOICES, WEEKDAY_ORDER, WEEKDAY_SHORT,
  clone, dateKey, type MedicationDraft,
} from '@/models/medication';

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
