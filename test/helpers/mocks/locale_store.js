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
 * TheLocaleStore.setLocales([{code: 'en', internal_code: 'en'}]);
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
      locales = _locales;
      defaultLocale = locales[0];
    }
  };

}]);
