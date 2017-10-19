'use strict';

angular.module('contentful')
.directive('cfCliEntryOnboard', ['require', function (require) {
  var createCliEntryComponent = require('app/home/app_entry_onboard/cli_entry_onboard/controller').createCliEntryComponent;

  return {
    restrict: 'E',
    scope: {
      setType: '&',
      choose: '&'
    },
    template: '<cf-component-store-bridge component="component">',
    controller: ['$scope', function ($scope) {
      var componentData = createCliEntryComponent({
        selectType: function (type) {
          $scope.type = type;
        },
        chooseType: function (type) {
          $scope.choose({ type: type });
        },
        type: $scope.type
      });

      $scope.component = componentData.component;
      $scope.$on('$destroy', componentData.cleanup);
    }]
  };
}]);
