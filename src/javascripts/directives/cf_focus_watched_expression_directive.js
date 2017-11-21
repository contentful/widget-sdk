'use strict';
/**
 * Directive that watches an expression and focuses the element when it evaluates to true
 * Usage: <div cf-focus-watched-expression="expression"></div>
 *
 */
angular.module('contentful')
.directive('cfFocusWatchedExpression', ['require', function(require) {

  var $timeout = require('$timeout');
  var $parse = require('$parse');

  return {
    restrict: 'A',
    link: function(scope, elem, attrs){

      var model = $parse(attrs.cfFocusWatchedExpression);

      scope.$watch(model, function(value) {
        if (value) {
          $timeout( function() {
            elem[0].focus();
          });
        }
      });

    }
  };
}]);
