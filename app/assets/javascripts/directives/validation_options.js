angular.module('contentful/directives').directive('validationOptions', function () {
  'use strict';

  return {
    restrict: 'C',
    template: JST['validation_options'](),
    scope: {
      validation: '='
    },
    replace: true,
    link: function (scope) {
      scope.validationType = function () {
        return _.keys(scope.validation)[0];
      };
    }
  };

});
