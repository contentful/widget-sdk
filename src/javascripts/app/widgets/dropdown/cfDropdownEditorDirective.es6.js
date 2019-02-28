import { registerDirective } from 'NgRegistry.es6';
import * as selectionController from 'app/widgets/selectionController.es6';

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfDropdownEditor
   */
  registerDirective('cfDropdownEditor', () => ({
    restrict: 'E',
    scope: {},
    template: JST['cf_dropdown_editor'](),
    require: '^cfWidgetApi',

    link: (scope, _elem, _attrs, widgetApi) => {
      selectionController.createFromValidations(widgetApi, scope);
    }
  }));
}
