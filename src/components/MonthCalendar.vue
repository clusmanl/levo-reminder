<template>
  <div class="cal">
    <div class="head">
      <ion-button fill="clear" size="small" :aria-label="t.calendar.previousMonth" @click="shift(-1)">
        <ion-icon slot="icon-only" :icon="chevronBack" />
      </ion-button>
      <strong class="title">{{ title }}</strong>
      <ion-button fill="clear" size="small" :aria-label="t.calendar.nextMonth" @click="shift(1)">
        <ion-icon slot="icon-only" :icon="chevronForward" />
      </ion-button>
    </div>

    <div class="grid">
      <span v-for="(l, i) in t.calendar.weekdayInitials" :key="i" class="dow">{{ l }}</span>
      <template v-for="(cell, i) in cells" :key="i">
        <span v-if="!cell" />
        <button
          v-else
          class="day"
          :class="[cell.status, { today: cell.key === todayKey }]"
          :disabled="cell.key > todayKey"
          @click="emit('select', cell.key)"
        >
          {{ cell.n }}
        </button>
      </template>
    </div>

    <div class="legend">
      <span><i class="dot taken" /> {{ t.calendar.taken }}</span>
      <span><i class="dot skipped" /> {{ t.calendar.skipped }}</span>
      <span><i class="dot missed" /> {{ t.calendar.missed }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { dateKey, type IntakeEntry } from '@/models/medication';
import { dateLocale, t } from '@/i18n';

const props = defineProps<{
  log: Record<string, IntakeEntry>;
  isDue: (key: string) => boolean;
  /** Premier jour suivi (YYYY-MM-DD) : avant, rien n'est "oublié". */
  since: string;
}>();
const emit = defineEmits<{ select: [string] }>();

const todayKey = dateKey();
const cursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

const title = computed(() => {
  const label = cursor.value.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
});

const cells = computed(() => {
  const y = cursor.value.getFullYear();
  const m = cursor.value.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // lundi = 0
  const count = new Date(y, m + 1, 0).getDate();
  const out: Array<null | { n: number; key: string; status: string }> = Array(lead).fill(null);
  for (let n = 1; n <= count; n++) {
    const key = dateKey(new Date(y, m, n));
    const entry = props.log[key];
    let status = '';
    if (entry) status = entry.status;
    else if (key < todayKey && key >= props.since && props.isDue(key)) status = 'missed';
    out.push({ n, key, status });
  }
  return out;
});

function shift(delta: number) {
  const c = cursor.value;
  cursor.value = new Date(c.getFullYear(), c.getMonth() + delta, 1);
}
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: 1.05rem; }
.grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
.dow { font-size: .75rem; color: var(--ion-color-medium); padding-bottom: 4px; }
.day {
  aspect-ratio: 1; border: 0; border-radius: 50%; font-size: .9rem;
  background: transparent; color: var(--ion-text-color); cursor: pointer;
}
.day:disabled { opacity: .35; cursor: default; }
.day.today { outline: 2px solid var(--ion-color-primary); outline-offset: -2px; }
.legend { display: flex; gap: 16px; justify-content: center; margin-top: 12px; font-size: .8rem; color: var(--ion-color-medium); }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; background: var(--status); }

/* Couleur de chaque statut, partagée par les jours et la légende. */
.taken { --status: var(--levo-check-color); }
.skipped { --status: var(--levo-cross-color); }
.missed { --status: var(--ion-color-warning); }
.day.taken,
.day.skipped { background: var(--status); color: var(--levo-check-contrast); }
.day.missed { background: color-mix(in srgb, var(--status) 35%, transparent); }
</style>
