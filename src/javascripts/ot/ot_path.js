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
    require: '^otDocFor',
    scope: true,
    controller: 'OtPathController'
  };
}])

/**
 * @ngdoc type
 * @name OtPathController
 * @property {otSubDoc} $scope.otSubDoc
 *
 * @description
 * Broadcasts the following events:
 * - otValueChanged(path, newValue), broadcast: Whenever the value at this path changes
 */
.controller('OtPathController', ['$injector', '$scope', '$attrs', function ($injector, $scope, $attrs) {
  var $q = $injector.get('$q');
  var ShareJS = $injector.get('ShareJS');
  var logger = $injector.get('logger');
  var diff = $injector.get('utils/StringDiff').diff;
  $scope.otPath = $scope.$eval($attrs.otPath);

  $scope.otSubDoc = {
    doc: undefined,
    changeString: otChangeString,
    changeValue: otChangeValue,
    getValue: otGetValue,
    removeValue: removeValue
  };

  $scope.$watch('otDoc.doc', init);
  $scope.$on('otRemoteOp', remoteOpHandler);

  function init () {
    if ($scope.otDoc.doc) {
      $scope.otSubDoc.doc = $scope.otDoc.doc.at($scope.otPath);
      $scope.otSubDoc.doc.path = angular.copy($scope.otPath);
      $scope.$broadcast('otValueChanged', $scope.otPath, otGetValue());
    } else if ($scope.otSubDoc.doc) {
      $scope.otSubDoc.doc = undefined;
    }
  }

  function remoteOpHandler (event, op) {
    var scope = event.currentScope;
    if (_.isEqual(op.p.slice(0, scope.otPath.length), scope.otPath)) {
      var value = ShareJS.peek(scope.otDoc.doc, scope.otPath);
      scope.$broadcast('otValueChanged', scope.otPath, value);
    }
  }

  function otChangeString (newValue) {
    var doc = $scope.otDoc.doc;
    var path = $scope.otPath;

    if (!doc) {
      // TODO should reject with an new Error instance
      return $q.reject('No otDoc to push to');
    }

    var oldValue = otGetValue();

    if (!oldValue || !newValue) {
      return ShareJS.setDeep(doc, path, newValue || null);
    } else if (oldValue === newValue) {
      return $q.resolve();
    } else {
      var patches = diff(oldValue, newValue);
      var ops = patches.map(function (p) {
        if (p.insert) {
          return $q.denodeify(function (cb) {
            doc.insertAt(path, p.insert[0], p.insert[1], cb);
          });
        } else if (p.delete) {
          return $q.denodeify(function (cb) {
            doc.deleteTextAt(path, p.delete[1], p.delete[0], cb);
          });
        }
      });
      return $q.all(ops);
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
  function otChangeValue (value) {
    var doc = $scope.otDoc.doc;
    var path = $scope.otPath;
    if (!doc) {
      return $q.reject('No otDoc to push to');
    }

    // Ensure that no nulls are passed to `doc.setAt()`. See BUG#6696
    if (value === null) {
      var err = 'Do not call otChangeValue() with null. This causes ' +
        'ShareJS to keep null placeholders for keys which we want to avoid.';
      logger.logWarn(err);
      return $q.reject(err);
    }

    // TODO we should replace this with `ShareJS.setDeep()`
    return $q.denodeify(function (cb) {
      doc.setAt(path, value, cb);
    }).catch(function () {
      return ShareJS.mkpathAndSetValue(doc, path, value);
    });
  }

  function otGetValue () {
    if ($scope.otDoc.doc) {
      return ShareJS.peek($scope.otDoc.doc, $scope.otPath);
    } else {
      return dotty.get($scope, ['entity', 'data'].concat($scope.otPath));
    }
  }

  function removeValue () {
    return $q.denodeify(function (cb) {
      $scope.otSubDoc.doc.remove(cb);
    });
  }
}]);
