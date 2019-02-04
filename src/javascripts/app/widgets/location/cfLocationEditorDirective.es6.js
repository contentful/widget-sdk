import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  registerDirective('cfLocationEditor', [
    '$controller',
    'app/widgets/location/Map.es6',
    ($controller, LocationMap) => ({
      restrict: 'E',
      require: '^cfWidgetApi',
      scope: {},
      template: JST.cf_location_editor(),
      link: function($scope, $el, _attrs, widgetApi) {
        const field = widgetApi.field;
        const searchResultsMenu = $el.find('[data-search-results]');
        const mapSlotElement = $el.find('[data-map-slot]').get(0);

        const offDisabledStatusChanged = field.onIsDisabledChanged(disabled => {
          $scope.isDisabled = disabled;
        });

        $scope.COORDINATES = 'coordinates';
        $scope.ADDRESS = 'address';
        $scope.inputMethod = $scope.ADDRESS;

        $scope.search = $controller('LocationEditorSearchController', { $scope: $scope });

        $scope.search.onResultsAvailable(() => {
          searchResultsMenu.show();
        });

        const offValueChanged = field.onValueChanged(location => {
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

        $scope.$watch('search.address', address => {
          if (address === '') {
            field.removeValue();
          }
        });

        LocationMap.init($scope, mapSlotElement);
      }
    })
  ]);
}
