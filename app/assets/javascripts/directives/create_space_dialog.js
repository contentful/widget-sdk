angular.module('contentful').directive('createSpaceDialog', function (client, notification, cfSpinner) {
    'use strict';

    return {
      restrict: 'EC',
      scope: true,
      template: JST['create_space_dialog'](),
      controller: function createSpaceDialogCtrl($scope) {
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
                notification.error('Could not create Space.');
                scope.lockSubmit = false;
                scope.hideCreateSpaceDialog();
                stopSpinner();
              } else {
                $scope.performTokenLookup(function () {
                  var space = _.find(scope.spaces, function (space) {
                    return space.getId() == newSpace.getId();
                  });
                  scope.selectSpace(space);
                  scope.lockSubmit = false;
                  scope.hideCreateSpaceDialog();
                  resetNewSpaceData();
                  stopSpinner();
                });
              }
            });
          });
        };
      },
      link: function (scope, elem) {
        //console.log('linking create space dialog');
        scope.$watch('displayCreateSpaceDialog', function (display) {
          if (display) elem.find('input').eq(0).focus();
        });

        elem.on('keyup', function(e) {
          if (e.keyCode === 27) scope.$apply(scope.hideCreateSpaceDialog());
        });
      }
    };
});
