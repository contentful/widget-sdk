angular.module('contentful').controller('createSpaceDialogCtrl', [
  '$scope', 'client', 'notification', 'cfSpinner', 'determineEnforcement',
  function createSpaceDialogCtrl($scope, client, notification, cfSpinner, determineEnforcement) {
    'use strict';

    function resetNewSpaceData() {
      $scope.newSpaceData = _.cloneDeep({defaultLocale: 'en-US'});
      $scope.lockSubmit = false;
    }

    resetNewSpaceData();

    $scope.createSpace = function () {
      if ($scope.lockSubmit) return;
      $scope.lockSubmit = true;
      var stopSpinner = cfSpinner.start();
      var data = {name: $scope.newSpaceData.name};
      if ($scope.newSpaceData.defaultLocale)
        data.defaultLocale = $scope.newSpaceData.defaultLocale;

      client.createSpace(data, function (err, newSpace) {
        $scope.$apply(function (scope) {
          if (err) {
            var errorMessage = 'Could not create Space';
            var usage = determineEnforcement.computeUsage('space');
            if(usage){ errorMessage = usage; }
            notification.serverError(errorMessage, err);
            scope.lockSubmit = false;
            scope.dialog.cancel();
            stopSpinner();
          } else {
            $scope.performTokenLookup().then(function () {
              var space = _.find(scope.spaces, function (space) {
                return space.getId() == newSpace.getId();
              });
              scope.selectSpace(space);
              scope.lockSubmit = false;
              scope.dialog.confirm();
              notification.info('Created space "'+ space.data.name +'"');
              resetNewSpaceData();
              stopSpinner();
            });
          }
        });
      });
    };
  }
]);
