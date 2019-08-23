import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfJsonEditor', () => ({
    restrict: 'E',
    scope: {},
    template: JST['cf_json_editor'](),
    require: '^cfWidgetApi',
    controller: 'JsonEditorController'
  }));
}
