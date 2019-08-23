import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfUrlEditor', [
    () => ({
      restrict: 'E',
      require: '^cfWidgetApi',
      scope: {},
      template: JST.cf_url_editor(),
      controller: 'UrlEditorController'
    })
  ]);
}
