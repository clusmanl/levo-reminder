<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="" />
        </ion-buttons>
        <ion-title>{{ med?.name ?? 'Médicament' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content v-if="med" class="ion-padding">
      <!-- Prise du jour -->
      <ion-card class="today">
        <ion-card-header>
          <ion-card-subtitle>Aujourd'hui</ion-card-subtitle>
          <ion-card-title>{{ todayLabel }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p v-if="todayEntry" class="state">
            {{ todayEntry.status === 'taken' ? 'Pris' : 'Ignoré' }}
            à {{ timeOf(todayEntry.at) }}
          </p>
          <p v-else-if="!isDue(med, todayKey)" class="state">Pas de prise prévue aujourd'hui.</p>
          <p v-else class="state">Prévu à {{ med.time }}. As-tu pris {{ med.name }} ?</p>

          <div class="actions">
            <ion-button class="btn-cross" fill="outline" size="large" aria-label="Ignorer" @click="mark('skipped')">
              <ion-icon slot="icon-only" :icon="close" />
            </ion-button>
            <ion-button class="btn-check" size="large" aria-label="Pris" @click="mark('taken')">
              <ion-icon slot="icon-only" :icon="checkmark" />
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Calendrier -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Historique</ion-card-title>
          <ion-card-subtitle>{{ takenThisMonth }} prise(s) ce mois-ci</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <MonthCalendar
            :log="med.log"
            :is-due="(k: string) => isDue(med!, k)"
            :since="med.createdAt.slice(0, 10)"
            @select="pickDay"
          />
        </ion-card-content>
      </ion-card>

      <!-- Réglages -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Réglages</ion-card-title>
        </ion-card-header>
        <MedicationForm v-model="draft" :show-enabled="true" />
      </ion-card>

      <ion-button expand="block" color="danger" fill="outline" class="ion-margin-top" @click="confirmDelete">
        <ion-icon slot="start" :icon="trashOutline" />
        Supprimer ce rappel
      </ion-button>
    </ion-content>

    <ion-content v-else class="ion-padding">
      <p>Ce médicament n'existe plus.</p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonCard,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon,
  actionSheetController, alertController,
} from '@ionic/vue';
import { checkmark, close, trashOutline } from 'ionicons/icons';
import MedicationForm from '@/components/MedicationForm.vue';
import MonthCalendar from '@/components/MonthCalendar.vue';
import { useMedications } from '@/stores/medications';
import {
  clone, dateKey, isDue, parseDateKey, type IntakeStatus, type MedicationDraft,
} from '@/models/medication';

const route = useRoute();
const router = useRouter();
const store = useMedications();

const id = computed(() => String(route.params.id));
const med = computed(() => store.get(id.value));
const todayKey = dateKey();
const todayEntry = computed(() => med.value?.log[todayKey]);

const todayLabel = computed(() => {
  const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
});

const takenThisMonth = computed(() => {
  const prefix = todayKey.slice(0, 7);
  return Object.entries(med.value?.log ?? {}).filter(([k, e]) => k.startsWith(prefix) && e.status === 'taken').length;
});

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/* ----- réglages : sauvegarde automatique (anti-rebond) ----- */

function draftFromMed(): MedicationDraft {
  const m = med.value!;
  return {
    name: m.name, time: m.time, frequency: clone(m.frequency),
    maxRepeats: m.maxRepeats, repeatIntervalMin: m.repeatIntervalMin, enabled: m.enabled,
  };
}

const draft = ref<MedicationDraft>(med.value ? draftFromMed() : ({} as MedicationDraft));
let timer: ReturnType<typeof setTimeout> | undefined;

watch(draft, (d) => {
  clearTimeout(timer);
  if (!d.name?.trim() || !med.value) return; // on n'enregistre jamais un nom vide
  timer = setTimeout(() => store.update(id.value, { ...d, name: d.name.trim() }), 500);
});

onBeforeUnmount(() => {
  clearTimeout(timer);
  const d = draft.value;
  if (med.value && d.name?.trim() && JSON.stringify(d) !== JSON.stringify(draftFromMed())) {
    store.update(id.value, { ...d, name: d.name.trim() });
  }
});

/* ----- prises ----- */

function mark(status: IntakeStatus) {
  // Un second appui sur le même bouton annule l'enregistrement.
  store.setIntake(id.value, todayKey, todayEntry.value?.status === status ? null : status);
}

async function pickDay(key: string) {
  const label = parseDateKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const sheet = await actionSheetController.create({
    header: label,
    buttons: [
      { text: 'Pris ✓', handler: () => void store.setIntake(id.value, key, 'taken') },
      { text: 'Ignoré ✗', handler: () => void store.setIntake(id.value, key, 'skipped') },
      { text: 'Effacer', role: 'destructive', handler: () => void store.setIntake(id.value, key, null) },
      { text: 'Annuler', role: 'cancel' },
    ],
  });
  await sheet.present();
}

async function confirmDelete() {
  const alert = await alertController.create({
    header: 'Supprimer ce rappel ?',
    message: 'Le médicament et tout son historique seront supprimés.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Supprimer', role: 'destructive',
        handler: async () => {
          clearTimeout(timer);
          await store.remove(id.value);
          router.replace('/home');
        },
      },
    ],
  });
  await alert.present();
}
</script>

<style scoped>
.state { font-size: 1.05rem; margin: 0 0 16px; }
.actions { display: flex; gap: 24px; justify-content: center; }
.actions ion-button { --border-radius: 50%; width: 76px; height: 76px; }
.actions ion-icon { font-size: 40px; }
.btn-check {
  --background: var(--levo-check-color);
  --background-activated: var(--levo-check-color);
  --background-hover: var(--levo-check-color);
  --color: var(--levo-check-contrast);
}
.btn-cross {
  --background: transparent;
  --color: var(--levo-cross-color);
  --border-color: var(--levo-cross-color);
  --border-width: 2px;
}
</style>
