'use strict';

angular.module('cf.app')
.directive('cfJsonEditor', ['require', function (require) {
  var Editor = require('app/widgets/json/code_editor');
  var LD = require('utils/LaunchDarkly');

  var STRUCTURED_TEXT_FIELD_DEMO_FEATURE_FLAG = 'feature-at-05-2018-structured-text-field-demo';

  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_json_editor'](),
    require: '^cfWidgetApi',
    link: function (scope, _$el, _attr, widgetApi) {
      scope.renderSlateEditor = false;
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

      LD.onFeatureFlag(scope, STRUCTURED_TEXT_FIELD_DEMO_FEATURE_FLAG, (variation) => {
        scope.renderSlateEditor = variation;

        if (scope.renderSlateEditor) {
          scope.slateEditorProps = {
            field: {
              ...widgetApi.field,
              linkType: 'Entry'
            }
          };
        }
      });

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
