'use strict';

angular.module('contentful')
.directive('cfNewOrganizationMembership', ['require', function (require) {
  var h = require('utils/hyperscript').h;

  return {
    template: h('.ornanization-membership-form', {
    }),
    scope: {
      context: '='
    },
    restrict: 'E',
    link: function (scope) {
      scope.context.ready = true;
    }
  };
}]);
