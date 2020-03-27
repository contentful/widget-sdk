import TheLocaleStore from 'services/localeStore';

export const SNAPSHOT = 'snapshot';
export const CURRENT = 'current';

export const getFieldPath = (fieldId, internalCode) => ['fields', fieldId, internalCode];

export const getLocalesForField = field => {
  const fieldLocales = field.localized
    ? TheLocaleStore.getPrivateLocales()
    : [TheLocaleStore.getDefaultLocale()];
  return fieldLocales.filter(TheLocaleStore.isLocaleActive);
};
