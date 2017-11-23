'use strict';

angular.module('cf.app')
.directive('cfJsonEditor', ['require', function (require) {
  var Editor = require('app/widgets/json/code_editor');

  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_json_editor'](),
    require: '^cfWidgetApi',
    link: function (scope, _$el, _attr, widgetApi) {
      var field = widgetApi.field;
      var offValueChanged = field.onValueChanged(function (json) {
        scope.content = stringifyJSON(json);
      });

      var offDisabledStatusChanged =
        field.onIsDisabledChanged(function (isDisabled) {
          scope.isDisabled = isDisabled;
        });

      scope.$on('$destroy', function () {
        offValueChanged();
        offDisabledStatusChanged();
      });

      scope.isLoading = true;

      Editor.create(widgetApi)
      .then(function (editor) {
        scope.editor = editor;
        scope.$on('$destroy', editor.destroy);
      }, function () {
        scope.hasCrashed = true;
      }).finally(function () {
        scope.isLoading = false;
      });
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
