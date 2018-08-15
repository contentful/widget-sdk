'use strict';

angular.module('cf.app')
.directive('cfStructuredTextEditor', [() => {
  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_structured_text_editor'](),
    require: '^cfWidgetApi',
    link: (scope, _$el, _attr, widgetApi) => {
      scope.slateEditorProps = {
        field: {
          ...widgetApi.field,
          linkType: 'Entry'
        },
        value: widgetApi.field.getValue()
      };
    }
  };
}]);
