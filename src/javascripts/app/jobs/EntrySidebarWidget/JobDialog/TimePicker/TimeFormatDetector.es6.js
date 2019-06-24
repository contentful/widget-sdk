import { get } from 'lodash';

/**
 * Time format: h | HH
 * @enum {string}
 */
export const TimeFormat = {
  /**
   * 12 hour time; am pm; h
   */
  H12: 'h',
  /**
   * 24 hour time; HH
   */
  H24: 'HH'
};

function tryGetLanguage() {
  return navigator.language;
}

function tryGetFromLanguages() {
  return get(navigator, ['languages', 0], tryGetLanguage());
}

const h12Langs = ['en-GB', 'en-US'];

/**
 * Returns preferred time format (HH, h) depending on the navigator.languages.
 * @returns {TimeFormat}
 */
export function getPreferredTimeFormat() {
  if (!navigator) {
    return TimeFormat.H24;
  }

  const language = tryGetFromLanguages();

  return h12Langs.includes(language) ? TimeFormat.H12 : TimeFormat.H24;
}
