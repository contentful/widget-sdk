'use strict';

angular.module('cf.app')
.directive('cfLocationEditor', ['$injector', function ($injector) {
  var $controller = $injector.get('$controller');
  var LocationMap = $injector.get('widgets/location/Map');

  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    scope: {},
    template: JST.cf_location_editor(),
    link: function ($scope, $el, attrs, widgetApi) {
      var field = widgetApi.field;
      var searchResultsMenu = $el.find('[data-search-results]');
      var mapSlotElement = $el.find('[data-map-slot]').get(0);

      var offDisabledStatusChanged = field.onDisabledStatusChanged(function (disabled) {
        $scope.isDisabled = disabled;
      });

      var offValueChanged = field.onValueChanged(function (location) {
        $scope.location = location || {};
      });

      $scope.COORDINATES = 'coordinates';
      $scope.ADDRESS = 'address';
      $scope.inputMethod = $scope.ADDRESS;

      $scope.$on('$destroy', offValueChanged);
      $scope.$on('$destroy', offDisabledStatusChanged);

      $scope.$watchCollection('location', function (location) {
        if (_.isNumber(location.lat) && _.isNumber(location.lon)) {
          field.setValue(location);
        } else {
          field.removeValue();
        }
      });

      $scope.search = $controller('LocationEditorSearchController', {$scope: $scope});

      $scope.search.onResultsAvailable(function () {
        searchResultsMenu.show();
      });

      LocationMap.init($scope, mapSlotElement);
    }
  };
}]);
