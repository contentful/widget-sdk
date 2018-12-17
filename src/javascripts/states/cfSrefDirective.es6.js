import { registerDirective } from 'NgRegistry.es6';
import * as Navigator from 'states/Navigator.es6';

/**
 * @ngdoc directive
 * @name cfSref
 * @description
 * Attribute directive similar to `uiSref` but instead of separating
 * state name and parameters they are passed as one value.
 *
 * The state references accepted by this directive can be generated
 * with the `states/Navigator` module.
 */
registerDirective('cfSref', () => ({
  restrict: 'A',
  link: function($scope, _$elem, $attrs) {
    $scope.$watch($attrs.cfSref, state => {
      $attrs.$set('href', Navigator.href(state));
    });
  }
}));
