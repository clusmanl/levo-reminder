<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t.home.title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="!medications.length" class="empty">
        <p>{{ t.home.emptyLine1 }}<br />{{ t.home.emptyLine2 }}</p>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="med in medications" :key="med.id">
          <ion-item button detail :router-link="`/medication/${med.id}`">
            <ion-icon slot="start" :icon="statusOf(med).icon" :class="statusOf(med).cls" />
            <ion-label>
              <h2>{{ med.name }}</h2>
              <p>{{ med.time }} · {{ describeFrequency(med.frequency) }}</p>
              <p v-if="!med.enabled">{{ t.home.disabled }}</p>
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
        <ion-fab-button :aria-label="t.home.addAria" @click="openAdd">
          <ion-icon :icon="add" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal :is-open="adding" @did-dismiss="adding = false">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="adding = false">{{ t.common.cancel }}</ion-button>
            </ion-buttons>
            <ion-title>{{ t.home.newTitle }}</ion-title>
            <ion-buttons slot="end">
              <ion-button :strong="true" :disabled="!draft.name.trim()" @click="create">{{ t.home.add }}</ion-button>
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
import { t } from '@/i18n';

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
  if (entry?.status === 'taken') return { icon: checkmarkCircle, cls: 'is-taken', label: t.home.statusTaken };
  if (entry?.status === 'skipped') return { icon: closeCircle, cls: 'is-skipped', label: t.home.statusSkipped };
  if (!isDue(med, dateKey())) return { icon: removeCircleOutline, cls: 'is-off', label: t.home.statusOff };
  return { icon: ellipseOutline, cls: 'is-pending', label: t.home.statusPending };
}

async function confirmDelete(id: string, name: string) {
  const alert = await alertController.create({
    header: t.home.deleteHeader,
    message: t.home.deleteMessage(name),
    buttons: [
      { text: t.common.cancel, role: 'cancel' },
      { text: t.common.delete, role: 'destructive', handler: () => remove(id) },
    ],
  });
  await alert.present();
}
</script>

<style scoped>
.empty { text-align: center; margin-top: 30vh; color: var(--ion-color-medium); padding: 0 24px; }
ion-icon.is-taken { color: var(--levo-check-color); }
ion-icon.is-skipped { color: var(--levo-cross-color); }
ion-icon.is-pending { color: var(--ion-color-warning); }
ion-icon.is-off { color: var(--ion-color-medium); }
</style>
