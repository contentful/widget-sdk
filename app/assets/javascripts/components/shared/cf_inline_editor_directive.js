'use strict';
angular.module('contentful').directive('cfInlineEditor', function(keycodes){
  return {
    restrict: 'A',
    template: JST['cf_inline_editor'](),
    require: 'ngModel',
    scope: true,
    link: function(scope, elem, attr, ngModelController) {
      ngModelController.$render = function () {
        scope.inner.text = ngModelController.$viewValue;
      };

      attr.$observe('required', function (value) {
        scope.required = value;
      });

      scope.$watch('inlineEditing', function (active) {
        if (active) _.defer(function(){
          elem.find('.inline-editor-form input').select().focus();
        });
      });

      scope.submitInlineForm = function () {
        ngModelController.$setViewValue(scope.inner.text);
        scope.inlineEditing = false;
      };

      scope.cancelInlineForm = function () {
        ngModelController.$render();
        scope.inlineEditing = false;
      };

      scope.$on('startInlineEditor', function (ev, item) {
        if (item == scope.$eval(attr.cfInlineEditor))
          scope.startEditing();
      });

      scope.keyDown = function ($event) {
        if ($event.keyCode === keycodes.ESC) scope.cancelInlineForm();
      };
    },
    controller: function ($scope) {
      $scope.inlineEditing = false;
      $scope.inner = {text: null};

      $scope.startEditing = function () {
        $scope.inlineEditing = true;
      };
    }
  };
});
