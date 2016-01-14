'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfFormWidget
 *
 * @property {API.Field}    field
 * @property {API.Locale[]} locales
 * @property {string}       showHelpText
 * @property {string}       helpText
 */
.directive('cfFormWidget', ['$injector', function ($injector) {
  var TheLocaleStore = $injector.get('TheLocaleStore');
  return {
    restrict: 'E',
    controller: ['$scope', function($scope) {
      $scope.hasInitialFocus = $scope.$index === 0 &&
                               $scope.widget.isFocusable;

      $scope.$watch('widget.field', function (field) {
        $scope.field = field;
      });

      $scope.$watch('widget.widgetParams.helpText', function (helpText) {
        $scope.helpText = helpText || $scope.widget.defaultHelpText;
      });

      $scope.$watch('widget.rendersHelpText', function (rendersHelpText) {
        $scope.showHelpText = !rendersHelpText;
      });

      $scope.$watchCollection(getActiveLocaleCodes, updateLocales);
      $scope.$watch('errorPaths', updateLocales);

      function getActiveLocaleCodes() {
        return _.pluck(TheLocaleStore.getActiveLocales(), 'internal_code');
      }

      function updateLocales () {
        var field = $scope.widget.field;
        var locales = _(getFieldLocales(field))
          .union(getErrorLocales(field))
          .filter(_.isObject)
          .uniq('internal_code')
          .value();
        $scope.locales = locales;
      }

      function getFieldLocales(field) {
        if (field.localized) {
          return TheLocaleStore.getActiveLocales();
        } else {
          return [TheLocaleStore.getDefaultLocale()];
        }
      }

      function getErrorLocales(field) {
        if ($scope.errorPaths) {
          var availableLocales = TheLocaleStore.getPrivateLocales();
          return _.map($scope.errorPaths[field.id], function (code) {
            return _.find(availableLocales, {internal_code: code});
          });
        } else {
          return [];
        }
      }
    }]
  };
}]);
