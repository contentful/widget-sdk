angular.module('contentful/directives').directive('fieldValidations', function() {
  'use strict';

  return {
    restrict: 'C',
    template: JST['field_validations'](),
    controller: 'FieldValidationsCtrl',
    link: function(scope, elem, attr) {

    }
  };

});
