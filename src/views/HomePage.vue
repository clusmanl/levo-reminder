<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Levo Reminder</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="!medications.length" class="empty">
        <p>Aucun rappel pour l'instant.<br />Appuie sur + pour ajouter un médicament.</p>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="med in medications" :key="med.id">
          <ion-item button detail :router-link="`/medication/${med.id}`">
            <ion-icon
              slot="start"
              :icon="statusOf(med).icon"
              :color="statusOf(med).color"
              :class="statusOf(med).cls"
            />
            <ion-label>
              <h2>{{ med.name }}</h2>
              <p>{{ med.time }} · {{ describeFrequency(med.frequency) }}</p>
              <p v-if="!med.enabled">Rappel désactivé</p>
            </ion-label>
            <ion-note slot="end">{{ statusOf(med).label }}</ion-note>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="confirmDelete(med.id, med.name)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button aria-label="Ajouter un médicament" @click="openAdd">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal :is-open="adding" @did-dismiss="adding = false">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="adding = false">Annuler</ion-button>
            </ion-buttons>
            <ion-title>Nouveau rappel</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" :disabled="!draft.name.trim()" @click="create">Ajouter</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <MedicationForm v-if="adding" v-model="draft" />
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonNote,
  IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonModal,
  IonButtons, IonButton, alertController,
} from '@ionic/vue';
import {
  add, trashOutline, checkmarkCircle, closeCircle, ellipseOutline, removeCircleOutline,
} from 'ionicons/icons';
import MedicationForm from '@/components/MedicationForm.vue';
import { useMedications } from '@/stores/medications';
import {
  describeFrequency, isDue, newDraft, dateKey, type Medication, type MedicationDraft,
} from '@/models/medication';

const router = useRouter();
const { medications, add: addMedication, remove } = useMedications();

const adding = ref(false);
const draft = ref<MedicationDraft>(newDraft());

function openAdd() {
  draft.value = newDraft();
  adding.value = true;
}

async function create() {
  const med = await addMedication({ ...draft.value, name: draft.value.name.trim() });
  adding.value = false;
  router.push(`/medication/${med.id}`);
}

function statusOf(med: Medication) {
  const entry = med.log[dateKey()];
  if (entry?.status === 'taken') return { icon: checkmarkCircle, color: undefined, cls: 'is-taken', label: 'Pris' };
  if (entry?.status === 'skipped') return { icon: closeCircle, color: undefined, cls: 'is-skipped', label: 'Ignoré' };
  if (!isDue(med, dateKey())) return { icon: removeCircleOutline, color: 'medium', label: 'Pas aujourd\'hui' };
  return { icon: ellipseOutline, color: 'warning', label: 'À prendre' };
}

async function confirmDelete(id: string, name: string) {
  const alert = await alertController.create({
    header: 'Supprimer ce rappel ?',
    message: `« ${name} » et tout son historique seront supprimés.`,
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Supprimer', role: 'destructive', handler: () => remove(id) },
    ],
  });
  await alert.present();
}
</script>

<style scoped>
.empty { text-align: center; margin-top: 30vh; color: var(--ion-color-medium); padding: 0 24px; }
</style>
