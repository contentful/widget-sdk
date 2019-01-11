import { registerDirective } from 'NgRegistry.es6';

registerDirective('cfRichTextEditor', () => ({
  restrict: 'E',
  scope: {},
  template: JST['cf_rich_text_editor'](),
  require: '^cfWidgetApi',
  link: (scope, _$el, _attr, widgetApi) => {
    scope.slateEditorProps = {
      entry: widgetApi.entry,
      field: widgetApi.field
    };
  }
}));
