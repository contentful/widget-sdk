'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name TheLocaleStore
 *
 * @description
 * This service holds information about the locales for the current
 * space.
 *
 * It is updated with the space ID and the space locales from the
 * 'spaceContext' service.
 *
 * This service also stores locale preferences in localStorage.
*/
.factory('TheLocaleStore', ['require', function (require) {
  var getStore = require('utils/TheStore').getStore;
  var create = require('TheLocaleStore/implementation').create;
  return create(getStore);
}])
.factory('TheLocaleStore/implementation', [function () {
  return {
    create: create
  };

  function create (getStore) {
    var store = null;
    var defaultLocale = null;

    // All locales fetched from the CMA, including delivery-only locales
    var locales = [];
    // Locales that can be used for entity editing
    var privateLocales = [];
    // List of currently active locales in entity editors
    var activeLocales = [];

    /**
     * Map of current locales and their active state.
     * If a locale is "active" it means the user can see it for editing
     * on the entry/asset editors.
     * This map uses internal locale codes as keys.
    */
    var codeToActiveLocaleMap = {};

    return {
      reset: reset,
      getLocales: getLocales,
      getDefaultLocale: getDefaultLocale,
      getActiveLocales: getActiveLocales,
      getPrivateLocales: getPrivateLocales,
      toInternalCode: toInternalCode,
      toPublicCode: toPublicCode,
      setActiveLocales: setActiveLocales,
      isLocaleActive: isLocaleActive,
      deactivateLocale: deactivateLocale
    };

    /**
     * @ngdoc method
     * @name TheLocaleStore#reset
     * @description
     * Updates the store's state by getting data from
     * the CMA `/locales` endpoint.
     * @param {Data.Endpoint} spaceEndpoint
     * @returns {Promise<void>}
     */
    function reset (spaceEndpoint) {
      return spaceEndpoint({method: 'GET', path: ['locales']})
      .then(function (res) {
        locales = res.items;
        privateLocales = locales.filter(function (locale) {
          return locale.contentManagementApi;
        });
        defaultLocale = _.find(privateLocales, {default: true}) || privateLocales[0];

        var spaceId = defaultLocale.sys.space.sys.id;
        store = getStore().forKey('activeLocalesForSpace.' + spaceId);

        var storedLocaleCodes = store.get() || [];
        var storedLocales = _.filter(privateLocales, function (locale) {
          return _.includes(storedLocaleCodes, locale.code);
        });

        setActiveLocales(storedLocales);
      });
    }

    /**
     * @ngdoc method
     * @name TheLocaleStore#isLocaleActive
     * @description
     * Returns true if a given locale is active, false otherwise
     * @param {API.Locale} locale
     * @returns {boolean}
     */
    function isLocaleActive (locale) {
      return !!codeToActiveLocaleMap[locale.internal_code];
    }

    /**
     * @ngdoc method
     * @name TheLocaleStore#getDefaultLocale
     * @returns {API.Locale}
     */
    function getDefaultLocale () {
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
    function getActiveLocales () {
      return activeLocales;
    }

    /**
     * @ngdoc method
     * @name TheLocaleStore#getLocales
     * @description
     * Returns a list of all locales.
     *
     * @returns {Array<API.Locale>}
     */
    function getLocales () {
      return locales;
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
    function getPrivateLocales () {
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
    function setActiveLocales (locales) {
      if (defaultLocale) {
        locales = locales.concat([defaultLocale]);
      }

      codeToActiveLocaleMap = _.transform(locales, function (map, locale) {
        map[locale.internal_code] = true;
      }, {});

      updateActiveLocalesList();
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
      updateActiveLocalesList();
    }

    /**
     * @ngdoc method
     * @name TheLocaleStore#toInternalCode
     * @param {string} publicCode
     * @returns {string}
     */
    function toInternalCode (publicCode) {
      var locale = _.find(privateLocales, {code: publicCode});
      return locale && locale.internal_code;
    }

    /**
     * @ngdoc method
     * @name TheLocaleStore#toInternalCode
     * @param {string} publicCode
     * @returns {string}
     */
    function toPublicCode (internalCode) {
      var locale = _.find(privateLocales, {internal_code: internalCode});
      return locale && locale.code;
    }

    /**
     * Update the list of active locales from the `codeToActiveLocaleMap`
     * hash.
     */
    function updateActiveLocalesList () {
      activeLocales = _.filter(privateLocales, isLocaleActive);
      activeLocales = _.uniqBy(activeLocales, function (locale) {
        return locale.internal_code;
      });

      store.set(_.map(activeLocales, 'code'));
    }
  }
}]);
