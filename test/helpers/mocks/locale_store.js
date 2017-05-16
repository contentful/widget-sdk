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
.factory('mocks/TheLocaleStore', ['$injector', function ($injector) {
  const createBase = $injector.get('TheLocaleStore/implementation').create;
  const TheStore = $injector.get('TheStore');
  const locales = [
    {code: 'en', internal_code: 'en-internal', name: 'English', default: true},
    {code: 'de', internal_code: 'de-internal', name: 'German'}
  ];

  const localeStoreMock = createBase(TheStore);

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
  localeStoreMock.setLocales = function (locales) {
    locales = locales.map(function (locale) {
      return _.extend({
        internal_code: locale.code + '-internal'
      }, locale);
    });
    locales[0].default = true;
    localeStoreMock.reset('SID', locales);
    localeStoreMock.setActiveLocales(_.reject(locales, function (locale) {
      return 'active' in locale && !locale.active;
    }));
  };

  localeStoreMock.setLocales(locales);

  return localeStoreMock;
}]);
