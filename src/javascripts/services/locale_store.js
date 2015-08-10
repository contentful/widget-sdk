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
.factory('TheLocaleStore', [function(){

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
    setActiveStates:      setActiveStates
  };

  /**
   * @ngdoc method
   * @name TheLocaleStore#resetWithSpace
   * @param {Object} space
  */
  function resetWithSpace(space) {
    _space = space;
    refreshLocales();
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#refreshLocales
   * @description
   * Refreshes all locale related information
  */
  function refreshLocales() {
    _state.privateLocales = _space.getPrivateLocales();
    _state.defaultLocale  = _space.getDefaultLocale();
    _state.localeActiveStates[_state.defaultLocale.internal_code] = true;
    refreshActiveLocales();
  }

  /**
   * Refreshes currently active locales list and locale states
  */
  function refreshActiveLocales() {
    _state.activeLocales = _.uniq(
      _.filter(_state.privateLocales, localeIsActive),
      function(locale){return locale.internal_code;}
    );
    _state.localeActiveStates = _.reduce(_state.activeLocales, function (states, locale) {
      states[locale.internal_code] = true;
      return states;
    }, {});
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getLocalesState
   * @return {Object}
   * @description
   * Returns the current state of all the locales store information
  */
  function getLocalesState() {
    return _state;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getDefaultLocale
   * @return {Object}
  */
  function getDefaultLocale() {
    return _space.getDefaultLocale();
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getActiveLocales
   * @return {Array}
  */
  function getActiveLocales() {
    return _state.activeLocales;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getPrivateLocales
   * @return {Array}
  */
  function getPrivateLocales() {
    return _state.privateLocales;
  }

  /**
   * @ngdoc method
  */
  function setActiveStates(localeActiveStates) {
    _state.localeActiveStates = localeActiveStates;
    refreshActiveLocales();
  }

  function localeIsActive(locale) {
    return _state.localeActiveStates[locale.internal_code];
  }

}]);
