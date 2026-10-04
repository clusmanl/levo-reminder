import { Capacitor, SystemBars, SystemBarType } from '@capacitor/core';

/**
 * Masque la barre de navigation Android (boutons retour / accueil / applications).
 * Un balayage depuis le bord de l'écran la fait réapparaître brièvement ;
 * on la re-masque à chaque retour au premier plan.
 */
export async function hideNavigationBar() {
  if (!Capacitor.isNativePlatform()) return;
  await SystemBars.hide({ bar: SystemBarType.NavigationBar });
}
