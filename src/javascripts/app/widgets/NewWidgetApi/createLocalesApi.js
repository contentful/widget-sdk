import TheLocaleStore from 'services/localeStore';
import { isRtlLocale } from 'utils/locales';

export function getLocalesObject({ availableLocales, defaultLocale }) {
  return {
    available: availableLocales.map((locale) => locale.code),
    default: defaultLocale.code,
    fallbacks: availableLocales.reduce((acc, locale) => {
      return { ...acc, [locale.code]: locale.fallbackCode || undefined };
    }, {}),
    names: availableLocales.reduce((acc, locale) => {
      return { ...acc, [locale.code]: locale.name };
    }, {}),
    optional: availableLocales.reduce((acc, locale) => {
      return { ...acc, [locale.code]: locale.optional };
    }, {}),
    direction: availableLocales.reduce((acc, locale) => {
      return { ...acc, [locale.code]: isRtlLocale(locale.code) ? 'rtl' : 'ltr' };
    }, {}),
  };
}

/**
 * @typedef { import("contentful-ui-extensions-sdk").LocalesApi } LocalesApi
 */

/**
 * @param {{ spaceContext: Object }}
 * @return {LocalesApi}
 */
export function createLocalesApi() {
  return getLocalesObject({
    availableLocales: TheLocaleStore.getPrivateLocales(),
    defaultLocale: TheLocaleStore.getDefaultLocale(),
  });
}
