'use strict';

/**
 * Specify the source of error messages for the `cf-error-list`
 * directive.
 *
 * @example(jade)
 *   cf-error-list(cf-error-messages='me.errors')
 *
 * The directive sets the scope's `error.messages` property by
 * evaluating the attribute value on the scope. In the above example
 * `scope.error.messages` is set to `scope.me.errors`
 *
 * This serves as a simpler alternative to the `cf-error-path`
 * directive.
 */
angular.module('contentful').directive('cfErrorMessages', function() {
  return {
    restrict: 'A',
    scope: true,
    controller: ['$scope', '$attrs', function($scope, $attrs) {
      $scope.$watch($attrs.cfErrorMessages, function(messages) {
        $scope.errors = {messages: messages};
      });
    }]
  };
});
