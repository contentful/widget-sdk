'use strict';

/**
 * @ngdoc directive
 * @name otPath
 * @scope.requires otDoc
 * @scope.requires entity
 * @scope.requires field
 * @scope.requires locale
 * @property otPath
 *
 * @description
 * Scopes a part of an ot component to a path within the ot document
 * defined by the value of the ot-path attribute
 *
 * @usage[html]
 * <entity-editor ot-doc-for="entity">
 *   <part-editor ot-path="['fields', 'fieldId', 'locale']">
*/

angular.module('contentful')
.directive('otPath', [function () {
  return {
    restrict: 'A',
    priority: 600,
    scope: true,
    controller: 'OtPathController',
    controllerAs: 'otSubDoc'
  };
}])

/**
 * @ngdoc type
 * @name OtPathController
 */
// TODO remove dependency on scope and make this a service
.controller('OtPathController', ['$injector', '$scope', '$attrs', function ($injector, $scope, $attrs) {
  var $q = $injector.get('$q');
  var K = $injector.get('utils/kefir');

  var otDoc = $scope.otDoc;
  var path = $scope.$eval($attrs.otPath);

  // ShareJS document instance attached to this path
  var doc = null;

  // The most recent value passed to `set()`.
  // We use this to filter change events that originate from a call to
  // `set()`.
  var lastSetValue = get();


  /**
   * @ngdoc property
   * @name OtPathController#valueProperty
   * @description
   * A property that contains the most recent value at the given
   * document path.
   *
   * Change events are not triggered when `set()` is called.
   *
   * @type {Property<any>}
   */
  var valueProperty = otDoc.valuePropertyAt(path)
    .filter(function (value) {
      return value !== lastSetValue;
    })
    .toProperty(get);


  _.extend(this, {
    setString: $scope.otDoc.setStringAt.bind(null, path),
    set: set,
    get: get,
    remove: remove,
    removeAt: removeAt,
    push: push,
    insert: insert,
    move: move,
    valueProperty: valueProperty,
    // TODO remove this. Only exists for compatibility with
    // `CfLinkEditorController`.
    onValueChanged: function (cb) {
      return K.onValue(valueProperty, cb);
    }
  });

  // TODO replace watcher with stream
  $scope.$watch('otDoc.doc', init);

  function init () {
    if ($scope.otDoc.doc) {
      doc = $scope.otDoc.doc.at(path);
    } else if (doc) {
      doc = null;
    }
  }

  /**
   * @ngdoc method
   * @name otPath#changeValue
   * @description
   * Updates the value at the path to the new value.
   *
   * @param {any} value
   * @returns {Promise<void>}
   */
  function set (value) {
    lastSetValue = value;
    return otDoc.setValueAt(path, value)
    .catch(function (error) {
      lastSetValue = get();
      return $q.reject(error);
    });
  }

  function get () {
    return otDoc.getValueAt(path);
  }

  function remove () {
    return otDoc.removeValueAt(path);
  }

  function removeAt (i) {
    return otDoc.removeValueAt(path.concat([i]));
  }

  function push (value) {
    if (!doc) {
      return $q.reject(new Error('ShareJS document is not connected'));
    }

    var current = get();
    if (current) {
      return $q.denodeify(function (cb) {
        doc.insert(current.length, value, cb);
      });
    } else {
      return set([value]);
    }
  }

  function insert (i, x) {
    if (doc) {
      return $q.reject(new Error('ShareJS document is not connected'));
    }

    if (get()) {
      return $q.denodeify(function (cb) {
        doc.insert(i, x, cb);
      });
    } else if (i === 0) {
      return set([x]);
    } else {
      return $q.reject(new Error('Cannot insert index ' + i + 'into empty container'));
    }
  }

  function move (i, j) {
    return $q.denodeify(function (cb) {
      doc.move(i, j, cb);
    });
  }
}]);
