'use strict';

angular.module('cf.app')
.directive('cfMultiLineEditor', ['$injector', function ($injector) {
  var InputUpdater = $injector.get('ui/inputUpdater');

  return {
    restrict: 'E',
    scope: {},
    template: '<textarea class="entry-editor__textarea" ng-disabled="isDisabled" aria-invalid="{{hasErrors}}">',
    require: '^cfWidgetApi',
    link: function ($scope, $el, _$attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.children('textarea');
      var updateInput = InputUpdater.create($inputEl.get(0));

      var offValueChanged = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        updateInput(val || '');
      });
      // call handler when the disabled status of the field changes
      var offDisabledStatusChanged = field.onDisabledStatusChanged(function (isDisabled) {
        $scope.isDisabled = isDisabled;
      });

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        $scope.hasErrors = errors && errors.length > 0;
      });

      $scope.$on('$destroy', offValueChanged);
      $scope.$on('$destroy', offDisabledStatusChanged);
      $scope.$on('$destroy', offSchemaErrorsChanged);

      $inputEl.on('input change', function () {
        field.setValue($inputEl.val());
      });
    }
  };
}]);
