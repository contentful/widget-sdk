'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfEntityField
 *
 * @property {API.Locale[]} $scope.locales
 * @property {object}       $scope.data
 *   Data that is read by the template
 * @property {API.Field}    $scope.data.field
 * @property {string}       $scope.data.helpText
 * @property {boolean}      $scope.data.showHelpText
 * @property {boolean}      $scope.data.hasInitialFocus
 * @property {boolean}      $scope.data.fieldHasFocus
 * @property {boolean}      $scope.data.fieldHasErrors
 *
 * @scope.requires {object} widget
 * Has field data and specifications to render the control. Provided by
 * `FromWidgetsController`.
 * @scope.requires {FieldControls/Focus} focus
 * @scope.requires {object} validator
 * Provided by the `cfValidate` directive.
 *
 */
.directive('cfEntityField', ['$injector', function ($injector) {
  var TheLocaleStore = $injector.get('TheLocaleStore');
  return {
    restrict: 'E',
    template: JST.cf_entity_field(),
    controllerAs: 'fieldController',
    controller: ['$scope', function ($scope) {
      // Records the 'invalid' flag for each locale’s control. Keys are public
      // locale codes.
      var invalidControls = {};

      var widget = $scope.widget;
      var field = widget.field;

      // All data that is read by the template
      var templateData = {
        field: field,
        helpText: widget.settings.helpText || widget.defaultHelpText,
        hasInitialFocus: $scope.$index === 0 && widget.isFocusable,
        showHelpText: !widget.rendersHelpText
      };
      $scope.data = templateData;

      /**
       * @ngdoc method
       * @name cfEntityField#fieldController.setInvalid
       * @description
       *
       * @param {string} localeId Public locale code
       * @param {boolean} isInvalid
       */
      this.setInvalid = function (localeId, isInvalid) {
        invalidControls[localeId] = isInvalid;
        updateErrorStatus();
      };

      $scope.$watchCollection(getActiveLocaleCodes, updateLocales);

      // TODO Changes to 'validator.errors' change the behavior of
      // 'validator.hasError()'. We should make this dependency explicity
      // by listening to signal on the validator.
      $scope.$watch('validator.errors', updateLocales);
      $scope.$watch('validator.errors', updateErrorStatus);

      var offFocusChanged = $scope.focus.onChanged(function (value) {
        $scope.data.fieldHasFocus = value === field.id;
      });

      $scope.$on('$destroy', function () {
        offFocusChanged();
      });

      function updateErrorStatus () {
        var hasSchemaErrors = $scope.validator.hasError(['fields', field.id]);
        var hasControlErrors = _.some(invalidControls);
        $scope.data.fieldHasErrors = hasSchemaErrors || hasControlErrors;
      }

      function getActiveLocaleCodes () {
        return _.map(TheLocaleStore.getActiveLocales(), 'internal_code');
      }

      function updateLocales () {
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
