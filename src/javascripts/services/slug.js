'use strict';

angular.module('contentful').factory('slug', ['$injector', function ($injector) {
  var getSlug = $injector.get('speakingurl');

  // Languages supported by SpeakingURL.
  var languages = ['ar', 'cz', 'de', 'en', 'es', 'fr', 'it',
                   'my', 'nl', 'pt', 'ru', 'sk', 'tr', 'vn'];

  /**
   * Extracts the first two lowercased characters from the locale,
   * and returns the supported language prefix.
   */
  function supportedLanguage(locale) {
    var prefix = locale.slice(0, 2).toLowerCase();
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
        '\'': '',
        '`':  ''
      }
    });
  }

  return {
    slugify: slugify
  };
}]);
