'use strict';

angular.module('contentful')
.directive('cfNewOrganizationMembership', ['require', require => {
  const controller = require('account/NewOrganizationMembership').default;

  return {
    template: '<cf-component-bridge component="component">',
    scope: {
      properties: '='
    },
    controller: ['$scope', controller]
  };
}]);
