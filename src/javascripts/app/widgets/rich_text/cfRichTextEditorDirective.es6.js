angular.module('cf.app').directive('cfRichTextEditor', [
  () => {
    return {
      restrict: 'E',
      scope: {},
      template: JST['cf_rich_text_editor'](),
      require: '^cfWidgetApi',
      link: (scope, _$el, _attr, widgetApi) => {
        scope.slateEditorProps = {
          entry: widgetApi.entry,
          field: {
            ...widgetApi.field,
            linkType: 'Entry' // TODO: Do we really need this?
          }
        };
      }
    };
  }
]);
