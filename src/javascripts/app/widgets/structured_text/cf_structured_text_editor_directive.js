'use strict';

angular.module('cf.app')
.directive('cfStructuredTextEditor', [() => {
  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_structured_text_editor'](),
    require: '^cfWidgetApi',
    link: (scope, _$el, _attr, widgetApi) => {
      // TODO: Move disabled state handling to react component.
      var field = widgetApi.field;
      var offValueChanged = field.onValueChanged((json) => {
        scope.content = stringifyJSON(json);
      });

      var offDisabledStatusChanged =
        field.onIsDisabledChanged((isDisabled) => {
          scope.isDisabled = isDisabled;
        });

      scope.$on('$destroy', () => {
        offValueChanged();
        offDisabledStatusChanged();
      });

      scope.slateEditorProps = {
        field: {
          ...widgetApi.field,
          linkType: 'Entry'
        }
      };
    }
  };

  function stringifyJSON (obj) {
    if (obj === null || obj === undefined) {
      return '';
    } else {
      return JSON.stringify(obj, null, 4);
    }
  }
}]);
