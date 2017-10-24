'use strict';

angular.module('contentful')
.directive('cfPlatformSubscription', ['require', function (require) {
  var controller = require('account/PlatformSubsciptionDetails').default;

  return {
    template: '<cf-component-bridge component="component">',
    scope: {
      properties: '='
    },
    controller: ['$scope', controller]
  };
}]);
