'use strict';

angular.module('contentful').directive('validationTypeDescription', function () {
  return {
    restrict: 'C',
    template: JST['validation_type_description']()
  };
});
