'use strict';

angular.module('cf.app')
.directive('cfListInputEditor', [function () {
  return {
    restrict: 'E',
    scope: {},
    template: JST.cf_list_input_editor(),
    require: '^cfWidgetApi',
    link: function ($scope, _$el, _attrs, widgetApi) {
      var field = widgetApi.field;

      var removeChangeListener = field.onValueChanged(function (items) {
        $scope.items = items || [];
      });

      var removeDisabledStatusListener = field.onDisabledStatusChanged(function (disabled) {
        $scope.isDisabled = disabled;
      }, true);

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        $scope.hasErrors = errors && errors.length > 0;
      });

      $scope.$on('$destroy', function () {
        removeChangeListener();
        removeDisabledStatusListener();
        offSchemaErrorsChanged();
      });

      $scope.$watchCollection('items', function (items) {
        if (items && items.length > 0) {
          field.setValue(items);
        } else {
          field.removeValue();
        }
      });
    }
  };
}]);
