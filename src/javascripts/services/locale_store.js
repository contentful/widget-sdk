'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name TheLocaleStore
 *
 * @description
 * This service holds all context related to a space, including contentTypes,
 * locales, and helper methods.
*/
.factory('TheLocaleStore', ['$injector', function ($injector){
  var store        = $injector.get('TheStore').forKey('activeLocales');
  var spaceContext = $injector.get('spaceContext');
  var $rootScope   = $injector.get('$rootScope');

  $rootScope.$watch(function () { return spaceContext.space; }, refreshLocales);

  var defaultLocale = null;
  // Locales which are available to the CMA
  var privateLocales = [];
  /**
   * Map of current locales and their active state.
   * If a locale is "active" it means the user can see it for editing
   * on the entry/asset editors.
  */
  var codeToActiveLocaleMap = {};
  // List of currently active locales visible in the entry/asset editors.
  var activeLocales = [];

  return {
    refreshLocales:    refreshLocales,
    getDefaultLocale:  getDefaultLocale,
    getActiveLocales:  getActiveLocales,
    getPrivateLocales: getPrivateLocales,
    setActiveLocales:  setActiveLocales,
    isLocaleActive:    isLocaleActive,
    deactivateLocale:  deactivateLocale
  };

  /**
   * @ngdoc method
   * @name TheLocaleStore#refreshLocales
   * @description
   * Updates the state of this service with the data set for the
   * current space.
   */
  function refreshLocales() {
    var space = spaceContext.space;
    privateLocales = space ? space.getPrivateLocales() : [];
    defaultLocale  = space ? space.getDefaultLocale()  : [];

    var storedLocaleCodes = store.get();
    var storedLocales = _.filter(privateLocales, function (locale) {
      return _.contains(storedLocaleCodes, locale.code);
    });

    setActiveLocales(storedLocales);
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#isLocaleActive
   * @description
   * Returns true if a given locale is active, false otherwise
   * @param {API.Locale} locale
   * @returns {boolean}
   */
  function isLocaleActive(locale) {
    return !!codeToActiveLocaleMap[locale.internal_code];
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getDefaultLocale
   * @returns {API.Locale}
   */
  function getDefaultLocale() {
    return defaultLocale;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getActiveLocales
   * @description
   * Returns a list of all locale objects that are currently active.
   *
   * This is used by the Asset and Entry editor to determine which
   * fields to display.
   *
   * @returns {Array<API.Locale>}
   */
  function getActiveLocales() {
    return activeLocales;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getPrivateLocales
   * @description
   * Returns a list of all locales for which content management is
   * enabled in this space.
   *
   * @returns {Array<API.Locale>}
   */
  function getPrivateLocales() {
    return privateLocales;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#setActiveLocales
   *
   * @param {Array<API.Locale>} locales
   *
   * @description
   * Activates exactly the locales in the list.
   *
   * ~~~js
   * localeStore.setActiveLocales([{internal_code: 'en'}])
   * assert(localeStore.isLocaleActive({internal_code: 'en'})
   * ~~~
   */
  function setActiveLocales(locales) {
    if (defaultLocale) {
      locales = locales.concat([defaultLocale]);
    }

    codeToActiveLocaleMap = _.transform(locales, function (map, locale) {
      map[locale.internal_code] = true;
    }, {});

    refreshActiveLocales();
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#deactivateLocale
   *
   * @param {API.Locale} locale
   *
   * @description
   * Activates exactly the locales in the list.
   *
   * ~~~js
   * localeStore.setActiveLocales([{internal_code: 'en'}])
   * localeStore.deactivateLocale({internal_code: 'en'})
   * assert(!localeStore.isLocaleActive({internal_code: 'en'})
   * ~~~
   */
  function deactivateLocale (locale) {
    delete codeToActiveLocaleMap[locale.internal_code];
    refreshActiveLocales();
  }

  /**
   * Update the list of active locales from the `codeToActiveLocaleMap`
   * hash.
   */
  function refreshActiveLocales() {
    var activePrivateLocales = _.filter(privateLocales, isLocaleActive);
    activeLocales = _.uniq(activePrivateLocales, function (locale) {
      return locale.internal_code;
    });

    store.set(_.map(activeLocales, 'code'));
  }

}]);
