import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const alertController = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@ionic/vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ionic/vue')>()),
  alertController,
}));

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
  IonToggle: {
    props: ['checked'],
    emits: ['ionChange'],
    template:
      '<input type="checkbox" class="toggle" :checked="checked" ' +
      "@change=\"$emit('ionChange', { detail: { checked: $event.target.checked }, target: $event.target })\" />",
  },
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

describe('MedicationForm : confirmation de désactivation', () => {
  type Button = { text: string; role?: string; handler?: () => void };
  const present = vi.fn();

  beforeEach(() => {
    alertController.create.mockReset();
    present.mockReset();
    alertController.create.mockResolvedValue({ present, onDidDismiss: () => new Promise(() => {}) });
  });

  const mountEnabled = (enabled: boolean) =>
    mount(MedicationForm, {
      props: { modelValue: { ...newDraft(), name: 'Lévo', enabled }, showEnabled: true },
      global: { stubs },
    });

  const lastEnabled = (w: ReturnType<typeof mountEnabled>) =>
    (w.emitted('update:modelValue') ?? []).at(-1)?.[0] as { enabled: boolean } | undefined;

  const setToggle = async (w: ReturnType<typeof mountEnabled>, checked: boolean) => {
    const input = w.find('input.toggle');
    (input.element as HTMLInputElement).checked = checked;
    await input.trigger('change');
  };

  const uncheck = async (w: ReturnType<typeof mountEnabled>) => {
    await setToggle(w, false);
    await vi.waitFor(() => expect(present).toHaveBeenCalled());
  };

  const buttons = () => alertController.create.mock.calls[0][0].buttons as Button[];

  it("n'affiche pas l'interrupteur sans show-enabled", () => {
    expect(mountForm('Lévo').find('input.toggle').exists()).toBe(false);
  });

  it('décocher ouvre une alerte de confirmation sans désactiver tout de suite', async () => {
    const w = mountEnabled(true);
    await uncheck(w);
    expect(present).toHaveBeenCalledTimes(1);
    expect(lastEnabled(w)?.enabled ?? true).toBe(true);
  });

  it('« Annuler » laisse enabled=true', async () => {
    const w = mountEnabled(true);
    await uncheck(w);
    const cancel = buttons().find((b) => b.text === 'Annuler');
    expect(cancel).toBeDefined();
    cancel?.handler?.();
    await w.vm.$nextTick();
    expect(lastEnabled(w)?.enabled ?? true).toBe(true);
  });

  it('« Désactiver » met enabled=false', async () => {
    const w = mountEnabled(true);
    await uncheck(w);
    const confirm = buttons().find((b) => b.text === 'Désactiver');
    expect(confirm).toBeDefined();
    confirm?.handler?.();
    await w.vm.$nextTick();
    expect(lastEnabled(w)?.enabled).toBe(false);
  });

  it('réactiver ne demande aucune confirmation', async () => {
    const w = mountEnabled(false);
    await setToggle(w, true);
    await w.vm.$nextTick();
    expect(alertController.create).not.toHaveBeenCalled();
    expect(lastEnabled(w)?.enabled).toBe(true);
  });
});
