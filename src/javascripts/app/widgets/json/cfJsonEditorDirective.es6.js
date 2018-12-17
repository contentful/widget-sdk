'use strict';

angular.module('cf.app').directive('cfJsonEditor', [
  'require',
  require => {
    const Editor = require('app/widgets/json/code_editor.es6');

    return {
      restrict: 'E',
      scope: {},
      template: JST['cf_json_editor'](),
      require: '^cfWidgetApi',
      link: (scope, _$el, _attr, widgetApi) => {
        const field = widgetApi.field;
        const offValueChanged = field.onValueChanged(json => {
          scope.content = stringifyJSON(json);
        });

        const offDisabledStatusChanged = field.onIsDisabledChanged(isDisabled => {
          scope.isDisabled = isDisabled;
        });

        scope.$on('$destroy', () => {
          offValueChanged();
          offDisabledStatusChanged();
        });

        try {
          scope.editor = Editor.create(widgetApi);
          scope.$on('$destroy', scope.editor.destroy);
        } catch (e) {
          scope.hasCrashed = true;
        }
      }
    };

    function stringifyJSON(obj) {
      if (obj === null || obj === undefined) {
        return '';
      } else {
        return JSON.stringify(obj, null, 4);
      }
    }
  }
]);
