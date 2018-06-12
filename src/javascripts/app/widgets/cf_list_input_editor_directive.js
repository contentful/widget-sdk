'use strict';

angular.module('cf.app')
.directive('cfListInputEditor', [() => ({
  restrict: 'E',
  scope: {},
  template: JST.cf_list_input_editor(),
  require: '^cfWidgetApi',

  link: function ($scope, _$el, _attrs, widgetApi) {
    var field = widgetApi.field;

    var removeChangeListener = field.onValueChanged(items => {
      $scope.items = items || [];
    });

    var removeDisabledStatusListener = field.onIsDisabledChanged(disabled => {
      $scope.isDisabled = disabled;
    }, true);

    var offSchemaErrorsChanged = field.onSchemaErrorsChanged(errors => {
      $scope.hasErrors = errors && errors.length > 0;
    });

    $scope.$on('$destroy', () => {
      removeChangeListener();
      removeDisabledStatusListener();
      offSchemaErrorsChanged();
    });

    $scope.$watchCollection('items', items => {
      if (items && items.length > 0) {
        field.setValue(items);
      } else {
        field.removeValue();
      }
    });
  }
})]);
