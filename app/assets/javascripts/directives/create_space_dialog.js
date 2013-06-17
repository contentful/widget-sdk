angular.module('contentful').directive('createSpaceDialog', function (client) {
    'use strict';

    return {
      restrict: 'EC',
      scope: true,
      template: JST['create_space_dialog'](),
      controller: function createSpaceDialogCtrl($scope) {
        function resetNewSpaceData() {
          $scope.newSpaceData = _.cloneDeep({defaultLocale: 'en-US'});
        }

        resetNewSpaceData();

        $scope.createSpace = function () {
          var data = {name: $scope.newSpaceData.name};
          if ($scope.newSpaceData.defaultLocale)
            data.defaultLocale = $scope.newSpaceData.defaultLocale;
          client.createSpace(data, function (err, newSpace) {
            console.log('new space', newSpace);
            $scope.performTokenLookup(function () {
              var space = _.find($scope.spaces, function (space) {
                return space.getId() == newSpace.getId();
              });
              $scope.selectSpace(space);
              $scope.hideCreateSpaceDialog();
              resetNewSpaceData();
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
