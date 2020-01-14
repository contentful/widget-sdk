import TheLocaleStore from 'services/localeStore';

/**
 * @typedef { import("contentful-ui-extensions-sdk").LocalesApi } LocalesApi
 */

/**
 * @param {{ spaceContext: Object }}
 * @return {LocalesApi}
 */
export function createLocalesApi() {
  const locales = {
    available: TheLocaleStore.getPrivateLocales(),
    default: TheLocaleStore.getDefaultLocale()
  };

  return {
    available: locales.available.map(locale => locale.code),
    default: locales.default.code,
    fallbacks: locales.available.reduce((acc, locale) => {
      return { ...acc, [locale.code]: locale.fallbackCode || undefined };
    }, {}),
    names: locales.available.reduce((acc, locale) => {
      return { ...acc, [locale.code]: locale.name };
    }, {})
  };
}
