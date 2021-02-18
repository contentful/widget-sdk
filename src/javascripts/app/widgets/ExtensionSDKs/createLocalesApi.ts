import localeStore from 'services/localeStore';
import { isRtlLocale } from 'utils/locales';
import { LocalesAPI } from '@contentful/app-sdk';

export interface Locale {
  name: string;
  code: string;
  fallbackCode?: string;
  optional?: boolean;
}

export function getLocalesObject({
  availableLocales,
  defaultLocale,
}: {
  availableLocales: Locale[];
  defaultLocale: Locale;
}): LocalesAPI {
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

export function createLocalesApi(): LocalesAPI {
  return getLocalesObject({
    availableLocales: localeStore.getPrivateLocales(),
    defaultLocale: localeStore.getDefaultLocale(),
  });
}
