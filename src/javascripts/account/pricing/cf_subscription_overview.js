'use strict';

angular.module('contentful')
.directive('cfSubscriptionOverview', ['require', function (require) {
  var controller = require('account/pricing/SubscriptionOverview').default;

  return {
    template: '<cf-component-bridge component="component">',
    scope: {
      properties: '='
    },
    controller: ['$scope', controller]
  };
}]);
