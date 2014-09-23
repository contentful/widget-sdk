'use strict';
angular.module('contentful').directive('cfRadioEditor', function(){
  return {
    restrict: 'E',
    template: JST['cf_radio_editor'](),
    require: 'ngModel',
    controller: 'MultipleValuesController',
    controllerAs: 'valuesController'
  };
});
