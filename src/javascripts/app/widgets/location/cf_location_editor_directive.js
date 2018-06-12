'use strict';

angular.module('cf.app')
.directive('cfLocationEditor', ['require', require => {
  var $controller = require('$controller');
  var LocationMap = require('app/widgets/location/Map');

  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    scope: {},
    template: JST.cf_location_editor(),
    link: function ($scope, $el, _attrs, widgetApi) {
      var field = widgetApi.field;
      var searchResultsMenu = $el.find('[data-search-results]');
      var mapSlotElement = $el.find('[data-map-slot]').get(0);

      var offDisabledStatusChanged = field.onIsDisabledChanged(disabled => {
        $scope.isDisabled = disabled;
      });

      $scope.COORDINATES = 'coordinates';
      $scope.ADDRESS = 'address';
      $scope.inputMethod = $scope.ADDRESS;

      $scope.search = $controller('LocationEditorSearchController', {$scope: $scope});

      $scope.search.onResultsAvailable(() => {
        searchResultsMenu.show();
      });

      var offValueChanged = field.onValueChanged(location => {
        $scope.location = location || {};
        $scope.search.updateAddressFromLocation();
      });

      $scope.$on('$destroy', offValueChanged);
      $scope.$on('$destroy', offDisabledStatusChanged);

      $scope.$watchCollection('location', location => {
        if (_.isNumber(location.lat) && _.isNumber(location.lon)) {
          field.setValue(location);
        } else {
          field.removeValue();
        }
      });

      LocationMap.init($scope, mapSlotElement);
    }
  };
}]);
