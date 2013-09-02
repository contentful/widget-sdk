'use strict';

angular.module('contentful').directive('otPath', function(ShareJS, cfSpinner) {

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
    controller: function OtPathCtrl($scope) {
      $scope.$on('otRemoteOp', function (event, op) {
        var scope = event.currentScope;
        //if (isSubPath(op.p)) {
        if (angular.equals(op.p, scope.otPath)) {
          // TODO introduce ot-on-change attr that can be used to bind instead of the events
          //console.log('broadcasting otValueChanged', scope.otPath, scope.otDoc, scope.otDoc.getAt(op.p));
          scope.$broadcast('otValueChanged', scope.otPath, scope.otDoc.getAt(op.p));
        }
      });

      $scope.otChangeValue = function(value, callback) {
        //console.log('changing value %o -> %o in %o, %o', $scope.otDoc.getAt($scope.otPath), value, $scope.otPath, $scope.otDoc);
        if ($scope.otDoc) {
          callback = callback || angular.noop;
          try {
            var stopSpin = cfSpinner.start();
            $scope.otDoc.setAt($scope.otPath, value, function () {
              var callbackArgs = arguments;
              $scope.$apply(function () {
                callback.apply(undefined, callbackArgs);
                stopSpin();
              });
            });
            //console.log('changin value returned %o %o in doc %o version %o', err, data, scope.otDoc, scope.otDoc.version);
          } catch(e) {
            ShareJS.mkpath({
              doc: $scope.otDoc,
              path: $scope.otPath,
              types: $scope.otPathTypes,
              value: value
            }, function () {
              var callbackArgs = arguments;
              $scope.$apply(function () {
                callback.apply(undefined, callbackArgs);
                stopSpin();
              });
            });
          }
        } else {
          console.error('No otDoc to push %o to', value);
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

    }
  };
});

