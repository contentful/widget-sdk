'use strict';
angular.module('contentful').directive('cfObjectEditor', function(){
  return {
    restrict: 'C',
    template: '<textarea class="input-xxlarge" ng-model="fieldData.value" ot-bind-model ng-disabled="!otEditable"></textarea>',
    replace: true,
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel){
      ngModel.$formatters.push(function (object) {
        return JSON.stringify(object);
      });
      ngModel.$parsers.push(function (string) {
        try {
          var json = JSON.parse(string);
          ngModel.$setValidity('json', true);
          return json;
        } catch (e) {
          ngModel.$setValidity('json', false);
          return undefined;
        }
      });

    }
  };
});
