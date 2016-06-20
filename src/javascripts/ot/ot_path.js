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

.controller('OtPathController', ['$injector', '$scope', '$attrs', function ($injector, $scope, $attrs) {
  var $q = $injector.get('$q');
  var Signal = $injector.get('signal');

  var otDoc = $scope.otDoc;
  var path = $scope.$eval($attrs.otPath);

  // ShareJS document instance attached to this path
  var doc = null;
  var valueChangedSignal = Signal.createMemoized(get());

  _.extend(this, {
    setString: $scope.otDoc.setStringAt.bind(null, path),
    set: set,
    get: get,
    remove: remove,
    removeAt: removeAt,
    push: push,
    insert: insert,
    move: move,

    // Signal is triggered with current value of this document when we
    // 1. Receive an remote operation
    // 2. Revert the entity through the entity state manager
    // TODO This approach does not cover all edge cases. E.g. a widget
    // might change a different field. This will not dispatch this
    // signal.
    onValueChanged: valueChangedSignal.attach
  });

  $scope.$watch('otDoc.doc', init);
  $scope.$on('otRemoteOp', function (_event, op) {
    if (pathAffects(op.p, path)) {
      valueChangedSignal.dispatch(get());
    }
  });

  $scope.$on('otValueReverted', function () {
    valueChangedSignal.dispatch(get());
  });

  function init () {
    if ($scope.otDoc.doc) {
      doc = $scope.otDoc.doc.at(path);
      valueChangedSignal.dispatch(get());
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
    return otDoc.setValueAt(path, value);
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

  /**
   * Returns true if a change to the value at 'changePath' in an object
   * affects the value of 'valuePath'.
   *
   * ~~~
   * pathAffects(['a'], ['a', 'b']) // => true
   * pathAffects(['a', 'b'], ['a', 'b']) // => true
   * pathAffects(['a', 'b', 'c'], ['a', 'b']) // => true
   */
  function pathAffects (changePath, valuePath) {
    var m = Math.min(changePath.length, valuePath.length);
    return _.isEqual(changePath.slice(0, m), valuePath.slice(0, m));
  }
}]);
