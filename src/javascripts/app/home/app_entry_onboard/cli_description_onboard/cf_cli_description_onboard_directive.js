'use strict';

angular.module('contentful')
.directive('cfCliDescriptionOnboard', ['require', function (require) {
  var createCliDescriptionComponent = require('app/home/app_entry_onboard/cli_description_onboard/controller').createCliDescriptionComponent;
  return {
    restrict: 'E',
    scope: {
      back: '&'
    },
    template: '<cf-component-store-bridge component="component" />',
    controller: ['$scope', function ($scope) {
      var componentData = createCliDescriptionComponent({ back: $scope.back });
      $scope.component = componentData.component;
      $scope.$on('$destroy', componentData.cleanup);
    }]
  };
}]);
