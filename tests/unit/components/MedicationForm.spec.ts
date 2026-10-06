import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MedicationForm from '@/components/MedicationForm.vue';
import { newDraft } from '@/models/medication';

// Composants Ionic remplacés par des équivalents minimaux : on teste la logique, pas Ionic.
const stubs = {
  IonList: { template: '<div><slot /></div>' },
  IonItem: { template: '<div><slot /></div>' },
  IonInput: { props: ['modelValue'], template: '<input class="field" :value="modelValue" />' },
  IonSelect: true,
  IonSelectOption: true,
  IonChip: true,
  IonRange: true,
  IonToggle: true,
};

const mountForm = (name: string) =>
  mount(MedicationForm, { props: { modelValue: { ...newDraft(), name } }, global: { stubs } });

describe('MedicationForm', () => {
  it('affiche le nom du brouillon', () => {
    expect(mountForm('Lévo').find('input.field').element.value).toBe('Lévo');
  });

  it('suit les modifications du brouillon faites par le parent (renommage)', async () => {
    const wrapper = mountForm('Lévo');
    await wrapper.setProps({ modelValue: { ...newDraft(), name: 'Vitamine D' } });
    expect(wrapper.find('input.field').element.value).toBe('Vitamine D');
  });

  it('ne boucle pas : la resynchronisation ne ré-émet pas indéfiniment', async () => {
    const wrapper = mountForm('Lévo');
    await wrapper.setProps({ modelValue: { ...newDraft(), name: 'Autre' } });
    await wrapper.vm.$nextTick();
    expect((wrapper.emitted('update:modelValue') ?? []).length).toBeLessThanOrEqual(2);
  });
});
