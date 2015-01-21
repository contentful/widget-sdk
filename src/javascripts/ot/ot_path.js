'use strict';

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
        //if (isSubPath(op.p)) {
        if (angular.equals(op.p, scope.otPath)) {
          // TODO introduce ot-on-change attr that can be used to bind instead of the events
          //console.log('broadcasting otValueChanged', scope.otPath, scope.otDoc, scope.otDoc.getAt(op.p));
          scope.$broadcast('otValueChanged', scope.otPath, scope.otDoc.getAt(op.p));
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
        if ($scope.otDoc) {
          var oldValue = $scope.otGetValue();
          var cb = $q.callbackWithApply(),
              cbOp1 = $q.callbackWithApply(),
              cbOp2 = $q.callbackWithApply();

          if (!oldValue || !newValue) {
            ShareJS.mkpath({
              doc: $scope.otDoc,
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
              $scope.otDoc.deleteTextAt($scope.otPath, oldValue.length - commonStart - commonEnd, commonStart, cbOp1);
            }
            if (newValue.length !== commonStart + commonEnd) {
              $scope.otDoc.insertAt($scope.otPath, commonStart, newValue.slice(commonStart, newValue.length - commonEnd), cbOp2);
            }
            return $q.all(cbOp1.promise, cbOp2.promise);
          }
        } else {
          return $q.reject('No otDoc to push to');
        }
      };

      $scope.otChangeValue = function (value) {
        if ($scope.otDoc) {
          var stopSpin = cfSpinner.start();
          var cb = $q.callbackWithApply();
          try {
            $scope.otDoc.setAt($scope.otPath, value, cb);
          } catch(e) {
            ShareJS.mkpath({
              doc: $scope.otDoc,
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

      $scope.$watch('otDoc', init);
      $scope.$watch('otPath', init);

      function init(val, old, scope) {
        // dispatch initial otValueChanged
        if (scope.otPath && scope.otDoc) {
          //console.log('init path', scope.otPath, scope.otGetValue());
          scope.$broadcast('otValueChanged', scope.otPath, scope.otGetValue());
        }
      }

      $scope.otGetValue = function () {
        if ($scope.otDoc) {
          return ShareJS.peek($scope.otDoc, $scope.otPath);
        } else {
          return void(0);
        }
      };

      // TODO attr "sync entity", that provides a value that can be bound to ng-models,
      // that writes back all changes that appear within here to the entity

    }]
  };
}]);

