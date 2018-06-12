'use strict';
/**
 * Directive that watches an expression and focuses the element when it evaluates to true
 * Usage: <div cf-focus-watched-expression="expression"></div>
 *
 */
angular.module('contentful')
.directive('cfFocusWatchedExpression', ['require', require => {

  var $timeout = require('$timeout');
  var $parse = require('$parse');

  return {
    restrict: 'A',
    link: function(scope, elem, attrs){

      var model = $parse(attrs.cfFocusWatchedExpression);

      scope.$watch(model, value => {
        if (value) {
          $timeout( () => {
            elem[0].focus();
          });
        }
      });

    }
  };
}]);
