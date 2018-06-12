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
.factory('mocks/TheLocaleStore', ['$injector', $injector => {
  const createBase = $injector.get('TheLocaleStore/implementation').create;
  const getStore = $injector.get('TheStore').getStore;
  const localeStoreMock = createBase(getStore);

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
  localeStoreMock.setLocales = locales => {
    locales = locales.map(locale => _.extend({
      sys: {space: {sys: {id: 'SID'}}},
      internal_code: `${locale.code}-internal`,
      contentManagementApi: true
    }, locale));

    locales[0].default = true;

    localeStoreMock.init({
      // simulate promise so it's synchronous no matter what
      getAll: () => ({then: handle => handle(locales)})
    });

    localeStoreMock.setActiveLocales(_.reject(locales, locale => {
      return 'active' in locale && !locale.active;
    }));
  };

  localeStoreMock.setLocales([
    {code: 'en', name: 'English'},
    {code: 'de', name: 'German'}
  ]);

  return localeStoreMock;
}]);
