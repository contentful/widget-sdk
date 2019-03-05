import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  registerDirective('cfRichTextEditor', () => ({
    restrict: 'E',
    scope: true,
    template: JST['cf_rich_text_editor'](),
    require: '^cfWidgetApi',
    link: (scope, _$el, _attr, widgetApi) => {
      scope.slateEditorProps = {
        entry: widgetApi.entry,
        field: widgetApi.field,
        permissions: widgetApi.permissions,
        loadEvents: scope.loadEvents,
        trackEntryEditorAction: (...args) => scope.loadEvents && scope.loadEvents.emit(...args)
      };
    }
  }));
}
