'use strict';

/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/TheLocaleStore
 * @description
 * Provides a subset of the [`TheLocaleStore`][1] interface with additional
 * methods to set the content of the store.
 *
 * [1]: api/contentful/app/service/TheLocaleStore
 *
 * @usage[js]
 * module('contentful/test', function ($provide) {
 *   $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
 * });
 * var TheLocaleStore = this.$inject('TheLocaleStore');
 * TheLocaleStore.setLocales([
 *   // Tis is the default locale
 *   {code: 'en'},
 *   // Internal code defaults to 'de-internal'
 *   {code: 'de'},
 *   // This object will not be returned by 'localeStore.getActiveLocales()'
 *   {code: 'fr', active: false}
 * ]);
 */
angular.module('contentful/mocks')
.factory('mocks/TheLocaleStore', [function () {
  var locales = [
    {code: 'en', internal_code: 'en-internal'},
    {code: 'de', internal_code: 'de-internal'}
  ];

  var defaultLocale = locales[0];

  return {
    getDefaultLocale: function () {
      return defaultLocale;
    },

    getPrivateLocales: function () {
      return locales;
    },

    getActiveLocales: function () {
      return _.filter(locales, function (locale) {
        return locale.active !== false;
      });
    },

    /**
     * @ngdoc method
     * @name mocks/TheLocaleStore#setLocales
     * @module contentful/mocks
     * @description
     * Set the value to be returned by `getPrivateLocales()`.
     *
     * The first value in the array will be the value returned by
     * `getDefaultLocale()`.
     *
     * @param {Array<API.Locale>} locales
     */
    setLocales: function (_locales) {
      locales = _locales.map(function (locale) {
        return _.extend({
          internal_code: locale.code + '-internal'
        }, locale);
      });
      defaultLocale = locales[0];
    }
  };

}]);
