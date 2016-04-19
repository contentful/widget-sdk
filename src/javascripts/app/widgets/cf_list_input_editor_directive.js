'use strict';

angular.module('cf.app')
.directive('cfListInputEditor', [function(){
  return {
    restrict: 'E',
    scope: {},
    template: '<input type="text" class="form-control" ng-list ng-model="items" ng-disabled="isDisabled">',
    require: '^cfWidgetApi',
    link: function ($scope, $el, attrs, widgetApi) {
      var field = widgetApi.field;

      var removeChangeListener = field.onValueChanged(function (items) {
        $scope.items = items || [];
      });

      var removeDisabledStatusListener = field.onDisabledStatusChanged(function (disabled) {
        $scope.isDisabled = disabled;
      }, true);

      $scope.$on('$destroy', function () {
        removeChangeListener();
        removeDisabledStatusListener();
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
