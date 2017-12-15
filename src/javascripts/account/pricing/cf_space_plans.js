'use strict';

angular.module('contentful')
.directive('cfSpacePlans', ['require', function (require) {
  var controller = require('account/pricing/SpacePlans').default;

  return {
    template: '<cf-component-bridge component="component">',
    scope: {
      properties: '='
    },
    controller: ['$scope', controller]
  };
}]);
