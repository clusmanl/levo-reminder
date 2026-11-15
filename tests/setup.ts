import { beforeEach } from 'vitest';
import { setLocale } from '@/i18n';

// Les tests assertent du texte français : on ne dépend pas de la langue de jsdom.
beforeEach(() => setLocale('fr'));
