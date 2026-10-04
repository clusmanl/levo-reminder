import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.levo.reminder',
  appName: 'Levo Reminder',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      // Icône monochrome (resources/android/ic_stat_notification.xml, copiée par `npm run icons`).
      smallIcon: 'ic_stat_notification',
      iconColor: '#8A6F47',
    },
  },
};

export default config;
