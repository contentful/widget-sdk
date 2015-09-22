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
  var store = $injector.get('TheStore').forKey('activeLocales');

  var _space = null;
  var _state = {
    defaultLocale: null,
    // Locales which are available to the CMA
    privateLocales: [],
    /**
     * Map of current locales and their active state.
     * If a locale is "active" it means the user can see it for editing
     * on the entry/asset editors.
    */
    localeActiveStates: {},
    //List of currently active locales visible in the entry/asset editors.
    activeLocales: []
  };

  return {
    resetWithSpace:       resetWithSpace,
    refreshLocales:       refreshLocales,
    getLocalesState:      getLocalesState,
    getDefaultLocale:     getDefaultLocale,
    getActiveLocales:     getActiveLocales,
    getPrivateLocales:    getPrivateLocales,
    setActiveStates:      setActiveStates,
    setActiveLocales:     setActiveLocales,
    localeIsActive:       localeIsActive,
    deactivateLocale:     deactivateLocale
  };

  /**
   * @ngdoc method
   * @name TheLocaleStore#resetWithSpace
   * @param {Client.Space} space
   */
  function resetWithSpace(space) {
    _space = space;
    refreshLocales();
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#refreshLocales
   * @description
   * Updates the state of this service with the data set for the
   * current space.
   */
  function refreshLocales() {
    _state.privateLocales = _space.getPrivateLocales();
    _state.defaultLocale  = _space.getDefaultLocale();
    var storedLocaleCodes = store.get();
    var storedLocales = _.filter(_state.privateLocales, function (locale) {
      return _.contains(storedLocaleCodes, locale.code);
    });
    setActiveLocales(storedLocales);
  }

  /**
   * Update the list of active locales from the `localeActiveStates`
   * hash.
   */
  function refreshActiveLocales() {
    _state.activeLocales = _.uniq(
      _.filter(_state.privateLocales, localeIsActive),
      function(locale){return locale.internal_code;}
    );
    store.set(_.pluck(_state.activeLocales, 'code'));
  }

  function localeIsActive(locale) {
    return !!_state.localeActiveStates[locale.internal_code];
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getLocalesState
   * @description
   * Returns the current state of all the locales store information
   *
   * TODO This interface is deprecated. We should remove all references
   * to it.
   * @returns {Object}
   */
  function getLocalesState() {
    return _state;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getDefaultLocale
   * @returns {API.Locale}
   */
  function getDefaultLocale() {
    return _state.defaultLocale;
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
    return _state.activeLocales;
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
    return _state.privateLocales;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#setActiveStates
   * @description
   * TODO This interface is deprecated
   */
  function setActiveStates(localeActiveStates) {
    _state.localeActiveStates = localeActiveStates;
    refreshActiveLocales();
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
   * localeStore.activateLocales([{internal_code: 'en'}])
   * assert(localeStore.isActive({internal_code: 'en'})
   * ~~~
   */
  function setActiveLocales(locales) {
    locales = locales.concat([_state.defaultLocale]);
    setActiveStates(_.transform(locales, function (active, locale) {
      active[locale.internal_code] = true;
    }, {}));
  }

  function deactivateLocale (locale) {
    delete _state.localeActiveStates[locale.internal_code];
    refreshActiveLocales();
  }

}]);
