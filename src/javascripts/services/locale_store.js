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
  var _space          = null;
  var _defaultLocale  = null;
  // Locales which are available to the CMA
  var _privateLocales = [];
  /**
   * Map of current locales and their active state.
   * If a locale is "active" it means the user can see it for editing
   * on the entry/asset editors.
  */
  var _localeStates   = {};
  //List of currently active locales visible in the entry/asset editors.
  var _activeLocales  = [];

  return {
    initializeWithSpace:     initializeWithSpace,
    refreshLocales:          refreshLocales,
    refreshActiveLocales:    refreshActiveLocales,
    getDefaultLocale:        getDefaultLocale,
    getActiveLocales:        getActiveLocales,
    getLocaleStates:         getLocaleStates,
    getPrivateLocales:       getPrivateLocales
  };

  /**
   * @ngdoc method
   * @name TheLocaleStore#initializeWithSpace
   * @param {Object} space
  */
  function initializeWithSpace(space) {
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
    _privateLocales = _space.getPrivateLocales();
    _defaultLocale  = _space.getDefaultLocale();
    _localeStates[_defaultLocale.internal_code] = true;
    refreshActiveLocales();
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#refreshActiveLocales
   * @description
   * Refreshes currently active locales list and locale states
  */
  function refreshActiveLocales() {
    var newLocaleStates = {};
    var newActiveLocales = [];
    _.each(_privateLocales, function (locale) {
      if (_localeStates[locale.internal_code]) {
        newLocaleStates[locale.internal_code] = true;
        newActiveLocales.push(locale);
      }
    });
    _localeStates = newLocaleStates;
    _activeLocales = _.uniq(newActiveLocales, function(locale){return locale.internal_code;});
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
    return _activeLocales;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getLocaleStates
   * @return {Array}
  */
  function getLocaleStates() {
    return _localeStates;
  }

  /**
   * @ngdoc method
   * @name TheLocaleStore#getPrivateLocales
   * @return {Array}
  */
  function getPrivateLocales() {
    return _privateLocales;
  }

}]);
