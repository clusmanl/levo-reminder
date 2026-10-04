import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ value: true }));
const hide = vi.hoisted(() => vi.fn());

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native.value },
  SystemBars: { hide },
  SystemBarType: { NavigationBar: 'NavigationBar', StatusBar: 'StatusBar' },
}));

import { hideNavigationBar } from '@/services/systemBars';

beforeEach(() => {
  native.value = true;
  hide.mockReset();
});

describe('hideNavigationBar', () => {
  it('masque uniquement la barre de navigation sur Android', async () => {
    await hideNavigationBar();
    expect(hide).toHaveBeenCalledWith({ bar: 'NavigationBar' });
  });

  it('ne fait rien dans le navigateur', async () => {
    native.value = false;
    await hideNavigationBar();
    expect(hide).not.toHaveBeenCalled();
  });
});
