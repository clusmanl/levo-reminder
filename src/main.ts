import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { IonicVue } from '@ionic/vue';
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
import './theme/variables.css';
import './theme/overrides.css';

import { useMedications } from './stores/medications';
import { initNotifications } from './services/notifications';
import { hideNavigationBar } from './services/systemBars';

const app = createApp(App)
  .use(IonicVue)
  .use(router);

const store = useMedications();

(async () => {
  await store.init();
  await initNotifications(
    // Clic sur une notification → page du médicament concerné.
    (medId) => router.push(`/medication/${medId}`),
    // Retour au premier plan → barre de navigation re-masquée, notifications replanifiées.
    () => {
      hideNavigationBar();
      store.rescheduleAll();
    },
  );
  await router.isReady();
  app.mount('#app');
  hideNavigationBar();
})();
