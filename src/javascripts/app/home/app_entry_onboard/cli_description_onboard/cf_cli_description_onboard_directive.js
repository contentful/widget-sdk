'use strict';

angular.module('contentful')
.directive('cfCliDescriptionOnboard', ['require', function (require) {
  var createCliDescriptionComponent = require('app/home/app_entry_onboard/cli_description_onboard/controller').createCliDescriptionComponent;
  var TokenStore = require('services/TokenStore');
  var K = require('utils/kefir');
  return {
    restrict: 'E',
    scope: {
      back: '&'
    },
    template: '<cf-component-store-bridge component="component" />',
    controller: ['$scope', function ($scope) {
      var properties = {
        back: $scope.back,
        user: K.getValue(TokenStore.user$)
      };
      var componentData = createCliDescriptionComponent(properties);
      $scope.component = componentData.component;
      $scope.$on('$destroy', componentData.cleanup);
    }]
  };
}]);
