'use strict';
angular.module('contentful').directive('cfObjectEditor', function(){
  return {
    restrict: 'C',
    template: '<textarea class="input-xxlarge" cf-input-autogrow ng-model="fieldData.value" ot-bind-model ng-disabled="!otEditable"></textarea>',
    replace: true,
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel){
      ngModel.$formatters.push(function (object) {
        return JSON.stringify(object, null, 2);
      });
      ngModel.$parsers.push(function (string) {
        try {
          if (string.match(/^\s*$/g)) {
            ngModel.$setValidity('json', true);
            return undefined;
          } else {
            var json = JSON.parse(string);
            ngModel.$setValidity('json', true);
            return json;
          }
        } catch (e) {
          ngModel.$setValidity('json', false);
          return undefined;
        }
      });

    }
  };
});
