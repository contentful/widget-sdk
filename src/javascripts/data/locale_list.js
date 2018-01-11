'use strict';

/**
 * @ngdoc service
 * @name data/localeList
 * @description
 * Data-only operations performed on
 * the list of locales.
 */
angular.module('cf.data')
.factory('data/localeList', ['require', function (require) {
  var localesList = require('localesList');

  return {create: create};

  function create (spaceLocales) {
    return {
      prepareLocaleList: asListItems(prepareLocaleList),
      prepareFallbackList: asListItems(prepareFallbackList),
      getDependantLocales: asListItems(getDependantLocales),
      hasDependantLocales: hasDependantLocales,
      getAvailableFallbackLocales: asListItems(getAvailableFallbackLocales)
    };

    function prepareFallbackList (code) {
      return spaceLocales.filter(canBeFallbackOf(code));
    }

    function getDependantLocales (code) {
      return spaceLocales.filter(function (locale) {
        var fallbackCode = locale.fallbackCode;
        return fallbackCode && fallbackCode === code;
      });
    }

    function hasDependantLocales (code) {
      return getDependantLocales(code).length > 0;
    }

    function getAvailableFallbackLocales (code) {
      var dependantLocales = getDependantLocales(code);
      return _.filter(spaceLocales, function (locale) {
        var isDependant = dependantLocales.indexOf(locale) > -1;
        return locale.code !== code && !isDependant;
      });
    }
  }

  function prepareLocaleList (locale) {
    return _.cloneDeep(localesList)
    .concat(getListExtension(locale));
  }

  /**
   * Creates a list extension that contains the provided
   * locale if it cannot be found on the predefined list
   * of locales. This accounts for user defined locales
   * created before the predefined list existed.
   */
  function getListExtension (locale) {
    if (!_.find(localesList, {code: locale.code}) && !!_.get(locale, 'sys.id')) {
      return [{code: locale.code, name: locale.name}];
    } else {
      return [];
    }
  }

  function canBeFallbackOf (code) {
    return function (locale) {
      return locale.contentDeliveryApi && locale.code !== code;
    };
  }

  function asListItems (fn) {
    return function () {
      return fn.apply(null, arguments)
      .map(localeToListItem);
    };
  }

  function localeToListItem (locale) {
    return {
      code: locale.code,
      name: locale.name,
      label: locale.name + ' (' + locale.code + ')'
    };
  }
}]);
