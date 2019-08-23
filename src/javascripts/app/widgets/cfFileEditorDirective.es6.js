import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfFileEditor', [
    () => {
      // TODO use isolated scope for this editor.
      // Ideally everything we do in here should be possible via `widgetApi`.
      // Right now we rely on parent scope properties like:
      // `editorData`, `editorContext`, `fieldLocale`, `locale`, `otDoc`
      return {
        restrict: 'E',
        require: '^cfWidgetApi',
        template: JST.cf_file_editor(),
        controller: 'FileEditorController'
      };
    }
  ]);
}
