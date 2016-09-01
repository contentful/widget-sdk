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
 * @scope.requires {FieldControls/Focus} focus
 * @scope.requires {object} validator
 * Provided by the `cfValidate` directive.
 *
 */
.directive('cfEntityField', [function () {
  return {
    restrict: 'E',
    template: JST.cf_entity_field(),
    controllerAs: 'fieldController',
    controller: 'EntityFieldController'
  };
}])

.controller('EntityFieldController', ['require', '$scope', function (require, $scope) {
  var TheLocaleStore = require('TheLocaleStore');
  $scope.hasInitialFocus = $scope.$index === 0 &&
                           $scope.widget.isFocusable;

  $scope.field = $scope.widget.field;
  // TODO I think this never changes
  $scope.$watch('widget.field', function (field) {
    $scope.field = field;
  });

  // Records the 'invalid' flag for each locale’s control. Keys are public
  // locale codes.
  var invalidControls = {};

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
  $scope.$watch('validator.errors', updateErrorStatus);

  var offFocusChanged = $scope.focus.onChanged(function (value) {
    $scope.fieldHasFocus = value === $scope.field.id;
  });

  $scope.$on('$destroy', function () {
    offFocusChanged();
  });

  function updateErrorStatus () {
    var hasSchemaErrors = $scope.validator.hasError(['fields', $scope.field.id]);
    var hasControlErrors = _.some(invalidControls);
    $scope.fieldHasErrors = hasSchemaErrors || hasControlErrors;
  }

  function getActiveLocaleCodes () {
    return _.map(TheLocaleStore.getActiveLocales(), 'internal_code');
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
}]);
