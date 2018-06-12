'use strict';

angular.module('cf.app')
.directive('cfJsonEditor', ['require', require => {
  var Editor = require('app/widgets/json/code_editor');

  return {
    restrict: 'E',
    scope: {
      structuredTextBeta: '@'
    },
    template: JST['cf_json_editor'](),
    require: '^cfWidgetApi',
    link: function (scope, _$el, _attr, widgetApi) {
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

      scope.renderSlateEditor = !!scope.structuredTextBeta;

      if (scope.renderSlateEditor) {
        scope.slateEditorProps = {
          field: {
            ...widgetApi.field,
            linkType: 'Entry'
          }
        };
      }

      try {
        scope.editor = Editor.create(widgetApi);
        scope.$on('$destroy', scope.editor.destroy);
      } catch (e) {
        scope.hasCrashed = true;
      }
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
