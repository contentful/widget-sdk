import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  /**
   * @ngdoc directive
   * @name uiAutofocus
   * @description
   * Add this attribute directive to focus an element once it is rendered
   */
  registerDirective('uiAutofocus', [
    '$timeout',
    $timeout => ({
      restrict: 'A',
      link: function(_$scope, $element) {
        $timeout(() => {
          $element[0].focus();
        });
      }
    })
  ]);
}
