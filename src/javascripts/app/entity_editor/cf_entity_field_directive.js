'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfEntityField
 *
 * @property {API.Field}    $scope.field
 * @property {API.Locale[]} $scope.locales
 * @property {string}       $scope.showHelpText
 * @property {string}       $scope.helpText
 *
 * @scope.requires {object} widget
 * Has field data and specifications to render the control. Provided by
 * `FromWidgetsController`.
 */
.directive('cfEntityField', ['$injector', function ($injector) {
  var TheLocaleStore = $injector.get('TheLocaleStore');
  return {
    restrict: 'E',
    template: JST.cf_entity_field(),
    controller: ['$scope', function ($scope) {
      $scope.hasInitialFocus = $scope.$index === 0 &&
                               $scope.widget.isFocusable;

      // TODO I think this never changes
      $scope.$watch('widget.field', function (field) {
        $scope.field = field;
      });

      $scope.$watch('widget.settings.helpText', function (helpText) {
        $scope.helpText = helpText || $scope.widget.defaultHelpText;
      });

      $scope.$watch('widget.rendersHelpText', function (rendersHelpText) {
        $scope.showHelpText = !rendersHelpText;
      });

      $scope.$watchCollection(getActiveLocaleCodes, updateLocales);

      // TODO Changes to 'validator.errors' change the behavior of
      // 'validator.hasError()'. We should make this dependency explicity
      // by listening to signal on the validator.
      $scope.$watch('validator.errors', updateLocales);

      function getActiveLocaleCodes () {
        return _.pluck(TheLocaleStore.getActiveLocales(), 'internal_code');
      }

      function updateLocales () {
        var field = $scope.widget.field;

        $scope.locales = _.filter(getFieldLocales(field), function (locale) {
          var isActive = TheLocaleStore.isLocaleActive(locale);
          var hasError = $scope.validator.hasError(['fields', field.id, locale.internal_code]);
          return isActive || hasError;
        });
      }

      function getFieldLocales (field) {
        if (field.localized) {
          return TheLocaleStore.getPrivateLocales();
        } else {
          return [TheLocaleStore.getDefaultLocale()];
        }
      }
    }]
  };
}]);
