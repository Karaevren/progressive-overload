import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { translations } from './translations';

const i18n = new I18n(translations);

// Detect device language
const deviceLocale = getLocales()?.[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale === 'tr' ? 'tr' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
