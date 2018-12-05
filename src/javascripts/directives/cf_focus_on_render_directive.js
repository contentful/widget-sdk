'use strict';
/**
 * Directive to focus an input element upon rendering
 *
 * Usage: <div cf-focus-on-render="optionalExpression"></div>
 *
 * The cf-focus-on-render attribute can be empty which means the element will
 * always be focused, or it can contain an expression which will be evaluated
 * on the scope and focus the field only if true.
 */
angular.module('contentful').directive('cfFocusOnRender', [
  'require',
  require => {
    var _ = require('lodash');
    return {
      restrict: 'A',

      link: function(scope, elem, attrs) {
        if (scope.$eval(attrs.cfFocusOnRender) || _.isEmpty(attrs.cfFocusOnRender)) {
          elem.focus();
        }
      }
    };
  }
]);
