'use strict';
/**
 * Directive to focus a child OT enabled input element
 *
 * Usage: <div cf-focus-ot-input="optionalExpression"></div>
 *
 * The cf-focus-ot-input attribute can be empty which means the element will
 * always be focused, or it can contain an expression which will be evaluated
 * on the scope and focus the field only if true.
 */
angular.module('contentful').directive('cfFocusOtInput', ['defer', function(defer){

  return {
    restrict: 'A',
    link: function(scope, elem, attrs){
      if(scope.$eval(attrs.cfFocusOtInput) || _.isEmpty(attrs.cfFocusOtInput)){
        var unwatchEditable = scope.$watch('otEditable', function focus() {
          if (scope.otEditable) {
            var input = elem.find('input').eq(0);
            defer(function () { input.focus(); });
            unwatchEditable();
          }
        });
      }
    }
  };
}]);
