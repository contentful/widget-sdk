import { registerController } from 'NgRegistry.es6';

import * as Editor from 'app/widgets/json/code_editor.es6';

function stringifyJSON(obj) {
  if (obj === null || obj === undefined) {
    return '';
  } else {
    return JSON.stringify(obj, null, 4);
  }
}

export default function register() {
  registerController('JsonEditorController', [
    '$scope',
    '$element',
    ($scope, $element) => {
      const widgetApi = $element.inheritedData('$cfWidgetApiController');
      const field = widgetApi.field;
      const offValueChanged = field.onValueChanged(json => {
        $scope.content = stringifyJSON(json);
      });

      const offDisabledStatusChanged = field.onIsDisabledChanged(isDisabled => {
        $scope.isDisabled = isDisabled;
      });

      $scope.$on('$destroy', () => {
        offValueChanged();
        offDisabledStatusChanged();
      });

      try {
        $scope.editor = Editor.create(widgetApi);
        $scope.$on('$destroy', $scope.editor.destroy);
      } catch (e) {
        $scope.hasCrashed = true;
      }
    }
  ]);
}
