'use strict';

/**
 * Scopes a part of an ot component to a path within the ot document
 *
 * Usage:
 * <entity-editor ot-doc-for="entity">
 *   <part-editor ot-path="['foo', 'bar', 'baz']" ot-path-types="['Array', 'Object', 'String']">
 *
 * The otPath attribute is evaluated against the scope and can contain variables or other expressions.
 * The otPathTypes attribute is used to inform about the type of each step in the path. This information is used by ShareJS.mkPath
 *
 * This directive puts the following properties on the scope:
 * - otPath: The evalualted otPath attribute
 * - otPathTypes: The evaluated otPathTypes attribute
 * - otGetValue(): Returns the value at the path in the document or undefined if the path is not found
 * - otChangeValue(value): Updates the value at the path to the new value. Returns a promise
 * - otChangeString(value): Update the string at the path to a new string.
 *   Calculates the string difference using the algorithm from the ShareJS text binding to generate a insert and/or delete operation.
 *   Returns a promise.
 *
 * Broadcasts the following events:
 * - otValueChanged(path, newValue), broadcast: Whenever the value at this path changes
 */
angular.module('contentful').directive('otPath', ['ShareJS', 'cfSpinner', '$q', function(ShareJS, cfSpinner, $q) {

  return {
    restrict: 'AC',
    priority: 600,
    require: '^otDocFor',
    scope: true,
    link: function(scope, elem, attr) {
      scope.$watch(attr['otPath'], function(otPath, old, scope) {
        scope.otPath = otPath;
      }, true);
      scope.$watch(attr['otPathTypes'], function(otPathTypes, old, scope) {
        scope.otPathTypes = otPathTypes;
      }, true);

      scope.otPath = scope.$eval(attr['otPath']);
      scope.otPathTypes = scope.$eval(attr['otPathTypes']);
    },
    controller: ['$scope', function OtPathController($scope) {
      $scope.$on('otRemoteOp', function (event, op) {
        var scope = event.currentScope;
        if (angular.equals(op.p, scope.otPath)) {
          scope.$broadcast('otValueChanged', scope.otPath, scope.otDoc.doc.getAt(op.p));
        }
      });

      /**
       * Replaces a string type field in the document  with a new string value by
       * computing the difference and generating a set of ShareJS operations to
       * manipulate the older string. This is useful in keeping the workflow natural
       * for editors in the scenario when a field is being hand-edited by one editor
       * but programmatically updated in the client of the other editor.
       * It also optimistically sends small operations whenever required instead of
       * sending the entire replacement string, which would be expensive with the kind
       * of incremental changes performed during typing.
       *
       * TL;DR - Simulates manual editing of the old string into the new string
       * for more natural collaboration.
       */
      $scope.otChangeString = function (newValue) {
        if ($scope.otDoc.doc) {
          var oldValue = $scope.otGetValue();
          var cb = $q.callbackWithApply(),
              cbOp1 = $q.callbackWithApply(),
              cbOp2 = $q.callbackWithApply();

          if (!oldValue || !newValue) {
            ShareJS.mkpathAndSetValue({
              doc: $scope.otDoc.doc,
              path: $scope.otPath,
              types: $scope.otPathTypes,
              value: newValue || null
            }, cb);
            return cb.promise;
          } else if (oldValue === newValue) {
            return $q.when(cb.promise);
          } else {
            var commonStart = 0,
                commonEnd = 0,
                oldEnd = oldValue.length - 1,
                newEnd = newValue.length - 1;

            while (oldValue.charAt(commonStart) === newValue.charAt(commonStart)) {
              commonStart += 1;
            }
            while (oldValue.charAt(oldEnd - commonEnd) === newValue.charAt(newEnd - commonEnd) &&
                   commonStart + commonEnd < oldValue.length && commonStart + commonEnd < newValue.length) {
              commonEnd += 1;
            }

            if (oldValue.length !== commonStart + commonEnd) {
              $scope.otDoc.doc.deleteTextAt($scope.otPath, oldValue.length - commonStart - commonEnd, commonStart, cbOp1);
            }
            if (newValue.length !== commonStart + commonEnd) {
              $scope.otDoc.doc.insertAt($scope.otPath, commonStart, newValue.slice(commonStart, newValue.length - commonEnd), cbOp2);
            }
            return $q.all(cbOp1.promise, cbOp2.promise);
          }
        } else {
          return $q.reject('No otDoc to push to');
        }
      };

      $scope.otChangeValue = function (value) {
        if ($scope.otDoc.doc) {
          var stopSpin = cfSpinner.start();
          var cb = $q.callbackWithApply();
          try {
            $scope.otDoc.doc.setAt($scope.otPath, value, cb);
          } catch(e) {
            ShareJS.mkpathAndSetValue({
              doc: $scope.otDoc.doc,
              path: $scope.otPath,
              types: $scope.otPathTypes,
              value: value
            }, cb);
          } finally {
            cb.promise.finally(stopSpin);
            return cb.promise;
          }
        } else {
          return $q.reject('No otDoc to push to');
        }
      };

      $scope.$watch('otDoc.doc', init);
      $scope.$watch('otPath', init);

      function init(val, old, scope) {
        // dispatch initial otValueChanged
        if (scope.otPath && scope.otDoc.doc) {
          //console.log('init path', scope.otPath, scope.otGetValue());
          scope.$broadcast('otValueChanged', scope.otPath, scope.otGetValue());
        }
      }

      $scope.otGetValue = function () {
        if ($scope.otDoc.doc) {
          return ShareJS.peek($scope.otDoc.doc, $scope.otPath);
        } else {
          return void(0);
        }
      };

      // TODO attr "sync entity", that provides a value that can be bound to ng-models,
      // that writes back all changes that appear within here to the entity

    }]
  };
}]);

