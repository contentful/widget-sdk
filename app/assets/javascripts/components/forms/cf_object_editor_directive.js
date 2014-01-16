'use strict';
angular.module('contentful').directive('cfObjectEditor', function(){
  return {
    restrict: 'C',
    template: JST['cf_object_editor'](),
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel){
      scope.jsonData = {
        value: undefined,
        editing: false
      };

      scope.textFieldModel = elem.find('textarea').controller('ngModel');

      scope.textFieldModel.$formatters.push(function (object) {
        return JSON.stringify(object, null, 2);
      });

      scope.textFieldModel.$parsers.push(function (string) {
        scope.textFieldModel.$setValidity('json', true);
        if (string.match(/^\s*$/g)) return undefined;
        try {
          var obj = JSON.parse(string);
          if (_.isArray(obj) || _.isPlainObject(obj)) return obj;
        } catch (e) {
        }
        scope.textFieldModel.$setValidity('json', false);
        return undefined;
      });

      ngModel.$render = function () {
        scope.jsonData.editing = false;
        scope.jsonData.value = angular.copy(ngModel.$viewValue);
        scope.textFieldModel.$setPristine();
        scope.textFieldModel.$setValidity('json', true);
        _.defer(function () {
          elem.find('textarea').trigger('autosize');
        });
      };

      scope.saveJSON = function () {
        scope.otChangeValue(scope.jsonData.value, function (err) {
          if (!err) {
            ngModel.$setViewValue(scope.jsonData.value);
            ngModel.$render();
          } else {
            ngModel.$render();
          }
        });
      };

      scope.revertJSON = function () {
        ngModel.$render();
      };

    }
  };
});
