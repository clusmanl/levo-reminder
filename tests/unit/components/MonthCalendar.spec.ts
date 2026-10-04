import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MonthCalendar from '@/components/MonthCalendar.vue';
import type { IntakeEntry } from '@/models/medication';

const entry = (status: IntakeEntry['status']): IntakeEntry => ({ status, at: '2026-10-01T08:00:00Z' });

function mountCalendar(props: Partial<InstanceType<typeof MonthCalendar>['$props']> = {}) {
  return mount(MonthCalendar, {
    props: { log: {}, isDue: () => true, since: '2026-09-01', ...props },
    global: { stubs: { IonButton: { template: '<button><slot /></button>' }, IonIcon: true } },
  });
}

const day = (wrapper: ReturnType<typeof mountCalendar>, n: number) =>
  wrapper.findAll('button.day').find((b) => b.text() === String(n))!;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 15, 12)); // 15 octobre 2026
});
afterEach(() => vi.useRealTimers());

describe('MonthCalendar', () => {
  it('affiche le mois courant avec tous ses jours', () => {
    const w = mountCalendar();
    expect(w.find('.title').text()).toBe('Octobre 2026');
    expect(w.findAll('button.day')).toHaveLength(31);
  });

  it('décale le 1er du mois sur la bonne colonne (lundi en premier)', () => {
    // 1er octobre 2026 = jeudi → 3 cases vides avant (lundi, mardi, mercredi)
    const w = mountCalendar();
    const grid = w.find('.grid').element.children;
    expect(grid[7].tagName).toBe('SPAN'); // lundi
    expect(grid[9].tagName).toBe('SPAN'); // mercredi
    expect(grid[10].textContent?.trim()).toBe('1'); // jeudi
  });

  it('marque pris / ignoré / oublié', () => {
    const w = mountCalendar({ log: { '2026-10-01': entry('taken'), '2026-10-02': entry('skipped') } });
    expect(day(w, 1).classes()).toContain('taken');
    expect(day(w, 2).classes()).toContain('skipped');
    expect(day(w, 3).classes()).toContain('missed'); // passé, dû, sans enregistrement
  });

  it("ne marque pas « oublié » aujourd'hui, le futur, les jours non dus ni avant le début du suivi", () => {
    const w = mountCalendar({ isDue: (k) => k !== '2026-10-05', since: '2026-10-03' });
    expect(day(w, 2).classes()).not.toContain('missed'); // avant `since`
    expect(day(w, 5).classes()).not.toContain('missed'); // non dû
    expect(day(w, 15).classes()).not.toContain('missed'); // aujourd'hui
    expect(day(w, 20).classes()).not.toContain('missed'); // futur
  });

  it("désactive les jours futurs et met aujourd'hui en évidence", () => {
    const w = mountCalendar();
    expect(day(w, 16).attributes('disabled')).toBeDefined();
    expect(day(w, 15).attributes('disabled')).toBeUndefined();
    expect(day(w, 15).classes()).toContain('today');
  });

  it('émet la date au clic sur un jour passé', async () => {
    const w = mountCalendar();
    await day(w, 7).trigger('click');
    expect(w.emitted('select')).toEqual([['2026-10-07']]);
  });

  it('navigue entre les mois', async () => {
    const w = mountCalendar();
    const [prev, next] = w.findAll('.head button');
    await prev.trigger('click');
    expect(w.find('.title').text()).toBe('Septembre 2026');
    expect(w.findAll('button.day')).toHaveLength(30);
    await next.trigger('click');
    await next.trigger('click');
    expect(w.find('.title').text()).toBe('Novembre 2026');
  });
});
