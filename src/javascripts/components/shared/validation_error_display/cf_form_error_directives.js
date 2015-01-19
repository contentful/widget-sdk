'use strict';

angular.module('contentful').directive('cfFormBoxError', function () {
  return {
    restrict: 'C',
    template: JST['cf_form_error'],
    require: 'cfErrorPath'
  };
});

angular.module('contentful').directive('cfFormInlineError', function () {
  return {
    restrict: 'C',
    template: JST['cf_form_error'],
    require: 'cfErrorPath'
  };
});

