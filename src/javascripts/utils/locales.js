import { isRtlLang } from 'rtl-detect';
import localesList from 'libs/locales_list.json';

const locales = localesList.map(({ code }) => code);

/**
 * Returns whether the given locale code represents a RTL language.
 * Always returns `false` for locales not featured in the web-app, e.g. custom
 * locales defined via the API.
 * @param {string} localeCode
 * @returns {boolean}
 */
export const isRtlLocale = (localeCode) => locales.includes(localeCode) && isRtlLang(localeCode);
