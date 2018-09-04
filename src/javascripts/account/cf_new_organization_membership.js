'use strict';

angular.module('contentful').directive('cfNewOrganizationMembership', [
  'require',
  require => {
    const controller = require('account/NewOrganizationMembership.es6').default;

    return {
      template: '<cf-component-bridge component="component">',
      scope: {
        properties: '='
      },
      controller: ['$scope', controller]
    };
  }
]);
