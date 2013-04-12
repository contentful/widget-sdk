'use strict';

angular.module('contentful/ot').directive('otPath', function(ShareJS, cfSpinner) {

  return {
    restrict: 'AC',
    require: '^otDocFor',
    scope: true,
    link: function(scope, elem, attr) {
      scope.$watch(attr['otPath'], function(otPath, old, scope) {
        scope.otPath = otPath;
      }, true);
    },
    controller: function OtPathCtrl($scope) {

      $scope.$on('otRemoteOp', function (event, op) {
        var scope = event.currentScope;
        //if (isSubPath(op.p)) {
        if (angular.equals(op.p, scope.otPath)) {
          scope.$broadcast('otValueChanged', scope.otPath, scope.otDoc.getAt(op.p));
        }
      });

      $scope.otChangeValue = function(value, callback) {
        //console.log('changing value %o -> %o in %o, %o', $scope.otDoc.getAt($scope.otPath), value, $scope.otPath, $scope.otDoc);
        if ($scope.otDoc) {
          callback = callback || function(err){if (!err) $scope.$apply();};
          try {
            var stopSpin = cfSpinner.start();
            $scope.otDoc.setAt($scope.otPath, value, function () {
              callback.apply(this, arguments);
              stopSpin();
            });
            //console.log('changin value returned %o %o in doc %o version %o', err, data, scope.doc, scope.doc.version);
          } catch(e) {
            ShareJS.mkpath($scope.doc, $scope.path, value, function () {
              callback.apply(this, arguments);
              stopSpin();
            });
          }
        } else {
          console.error('No otDoc to push %o to', value);
        }
      };

    }
  };
});

