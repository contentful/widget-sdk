'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @name entityEditor/FieldLocaleDocument
 */
.factory('entityEditor/FieldLocaleDocument', ['require', function (require) {
  var $q = require('$q');

  return {
    create: create
  };

  /**
   * @ngdoc type
   * @name FieldLocaleDocument
   */
  function create (doc, fieldId, localeCode) {
    var path = ['fields', fieldId, localeCode];

    var getValue = bindToPath('getValueAt');

    // The most recent value passed to `set()`.
    // We use this to filter change events that originate from a call to
    // `set()`.
    var lastSetValue = getValue();

    /**
     * @ngdoc property
     * @name FieldLocaleDocument#valueProperty
     * @description
     * A property that contains the most recent value at the given
     * document path.
     *
     * Change events are not triggered when `set()` is called.
     *
     * @type {Property<any>}
     */
    var valueProperty = doc.valuePropertyAt(path)
      .filter(function (value) {
        return value !== lastSetValue;
      })
      .toProperty(getValue);


    return {
      set: set,
      get: getValue,
      remove: bindToPath('removeValueAt'),
      removeAt: removeAt,
      push: bindToPath('pushValueAt'),
      insert: bindToPath('insertValueAt'),
      move: bindToPath('moveValueAt'),
      valueProperty: valueProperty,
      collaborators: doc.collaboratorsFor(fieldId, localeCode),
      notifyFocus: notifyFocus
    };

    function notifyFocus () {
      return doc.notifyFocus(fieldId, localeCode);
    }

    function set (value) {
      lastSetValue = value;
      return doc.setValueAt(path, value)
      .catch(function (error) {
        lastSetValue = getValue();
        return $q.reject(error);
      });
    }

    function removeAt (i) {
      return doc.removeValueAt(path.concat([i]));
    }

    function bindToPath (method) {
      return doc[method].bind(null, path);
    }
  }
}]);
