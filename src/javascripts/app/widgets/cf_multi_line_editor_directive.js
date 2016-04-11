'use strict';

angular.module('cf.app')
.directive('cfMultiLineEditor', ['$injector', function ($injector) {
  var makeInputUpdater = $injector.get('ui/caretHelper').makeInputUpdater;

  return {
    restrict: 'E',
    scope: {},
    template: '<textarea class="form-control" ng-disabled="isDisabled">',
    require: '^cfWidgetApi',
    link: function ($scope, $el, $attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.children('textarea');
      var updateInput = makeInputUpdater($inputEl);

      var offValueChanged = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        updateInput(val || '');
      }, true);
      // call handler when the disabled status of the field changes
      var offDisabledStatusChanged = field.onDisabledStatusChanged(function (isDisabled) {
        $scope.isDisabled = isDisabled;
      }, true);

      $scope.$on('$destroy', offValueChanged);
      $scope.$on('$destroy', offDisabledStatusChanged);

      $inputEl.on('input change', function () {
        field.setString($inputEl.val());
      });
    }
  };
}]);
