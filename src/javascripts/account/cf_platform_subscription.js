'use strict';

angular.module('contentful')
.directive('cfPlatformSubscription', ['require', function (require) {
  var controller = require('account/PlatformSubscriptionDetails').default;

  return {
    template: '<cf-component-bridge component="component">',
    scope: {
      properties: '='
    },
    controller: ['$scope', controller]
  };
}]);
