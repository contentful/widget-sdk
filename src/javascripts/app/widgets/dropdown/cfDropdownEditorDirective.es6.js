import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfDropdownEditor
   */
  registerDirective('cfDropdownEditor', [
    'widgets/selectionController',
    selectionController => ({
      restrict: 'E',
      scope: {},
      template: JST['cf_dropdown_editor'](),
      require: '^cfWidgetApi',

      link: function(scope, _elem, _attrs, widgetApi) {
        selectionController.createFromValidations(widgetApi, scope);
      }
    })
  ]);
}
