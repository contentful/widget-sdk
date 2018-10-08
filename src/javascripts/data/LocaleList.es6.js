import localesList from 'localesList';
import _ from 'lodash';

/**
 * Data-only operations performed on the list of locales.
 */
export function create(spaceLocales) {
  return {
    prepareLocaleList: asListItems(prepareLocaleList),
    prepareFallbackList: asListItems(prepareFallbackList),
    getDependantLocales: asListItems(getDependantLocales),
    hasDependantLocales: hasDependantLocales,
    getAvailableFallbackLocales: asListItems(getAvailableFallbackLocales)
  };

  function prepareFallbackList(code) {
    return spaceLocales.filter(canBeFallbackOf(code));
  }

  function getDependantLocales(code) {
    return spaceLocales.filter(locale => {
      const fallbackCode = locale.fallbackCode;
      return fallbackCode && fallbackCode === code;
    });
  }

  function hasDependantLocales(code) {
    return getDependantLocales(code).length > 0;
  }

  function getAvailableFallbackLocales(code) {
    const dependantLocales = getDependantLocales(code);
    return _.filter(spaceLocales, locale => {
      const isDependant = dependantLocales.indexOf(locale) > -1;
      return locale.code !== code && !isDependant;
    });
  }
}

function prepareLocaleList(locale) {
  return _.cloneDeep(localesList).concat(getListExtension(locale));
}

/**
 * Creates a list extension that contains the provided
 * locale if it cannot be found on the predefined list
 * of locales. This accounts for user defined locales
 * created before the predefined list existed.
 */
function getListExtension(locale) {
  if (!_.find(localesList, { code: locale.code }) && !!_.get(locale, 'sys.id')) {
    return [{ code: locale.code, name: locale.name }];
  } else {
    return [];
  }
}

function canBeFallbackOf(code) {
  return locale => locale.contentDeliveryApi && locale.code !== code;
}

function asListItems(fn) {
  return function(...args) {
    return fn(...args).map(localeToListItem);
  };
}

function localeToListItem(locale) {
  return {
    code: locale.code,
    name: locale.name,
    label: locale.name + ' (' + locale.code + ')'
  };
}
