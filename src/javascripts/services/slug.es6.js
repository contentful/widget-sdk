import { registerFactory } from 'NgRegistry.es6';
import getSlug from 'speakingurl';

export default function register() {
  registerFactory('slug', () => {
    // Languages supported by SpeakingURL.
    const languages = [
      'ar',
      'az',
      'cs',
      'de',
      'dv',
      'en',
      'es',
      'fa',
      'fi',
      'fr',
      'ge',
      'gr',
      'hu',
      'it',
      'lt',
      'lv',
      'my',
      'mk',
      'nl',
      'pl',
      'pt',
      'ro',
      'ru',
      'sk',
      'sr',
      'tr',
      'uk',
      'vn'
    ];

    /**
     * Extracts the first two lowercased characters from the locale,
     * and returns the supported language prefix.
     */
    function supportedLanguage(locale) {
      const prefix = locale.slice(0, 2).toLowerCase();
      return languages[languages.indexOf(prefix)];
    }

    /**
     * Returns the slug for a given string and locale.
     * If the locale belongs to a language supported by SpeakingURL, it
     * is used as the symbol language. Otherwise, the symbol language
     * is english.
     * Slug suggestions are limited to 75 characters.
     */
    function slugify(text, locale) {
      return getSlug(text, {
        separator: '-',
        lang: supportedLanguage(locale) || 'en',
        truncate: 75,
        custom: {
          "'": '',
          '`': ''
        }
      });
    }

    return {
      slugify: slugify
    };
  });
}
