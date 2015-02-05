'use strict';

/**
 * Controls the 'Field Validations' dialog.
 *
 * The controller provides the `scope.validations` array and an
 * `update` function.
 *
 * Requires the following scope properties:
 *
 * - `scope.field`  A ContentType field property.
 * - `scope.index`  The index of the field in all Content Type fields.
 * - `scope.otDoc`  ShareJS document for the Content Type.
 */
angular.module('contentful').controller('ValidationDialogController', ['$scope', '$injector', function($scope, $injector) {
  var availableValidations = $injector.get('availableValidations');
  var validationType       = availableValidations.type;
  var validationName       = availableValidations.name;
  var logger               = $injector.get('logger');
  var notification         = $injector.get('notification');
  var controller           = this;


  // Create decorated validations from field
  var availableFieldValidations = availableValidations.forField($scope.field);
  $scope.validations = _.map(availableFieldValidations, decorateValidation);
  updateValidationsFromField();


  /**
   * Default update method. Maybe overwritten by child directives.
   */
  $scope.update = function() {
    controller.update();
  };

  /**
   * Write the scope validations to the OT Document and the Content
   * Type's field.
   */
  controller.update = function() {
    var validations =
      _($scope.validations).filter('enabled').map(extractDecoratedValidation).value();

    var validationsDoc = $scope.otDoc.at(validationListPath());
    validationsDoc.set(validations, function(error) {
      if (error) {
        logger.logServerWarn('Could not save validations', {error: error });
        notification.error('Could not save validations');
      } else {
        setFieldValidations(validations);
        updateValidationsFromField();
      }
    });
  };


  function decorateValidation(backendValidation) {
    var type = validationType(backendValidation);
    var settings = _.cloneDeep(backendValidation[type]);
    return {
      name: validationName(backendValidation),
      type: type,
      enabled: false,
      settings: settings
    };
  }

  function extractDecoratedValidation(validation) {
    var extracted = {};
    extracted[validation.type] = validation.settings;
    return extracted;
  }

  function validationListPath() {
    if ($scope.field.type == 'Array')
      return ['fields', $scope.index, 'items', 'validations'];
    else
      return ['fields', $scope.index, 'validations'];
  }

  /**
   * Sets the 'enabled' falg and the 'errorPath' for the decorated
   * validations according to their presence in `field.validations`.
   */
  function updateValidationsFromField() {
    _.forEach($scope.validations, function(validation) {
      var enabledValidation = getFieldValidation(validation.type);
      if (enabledValidation) {
        validation.enabled = true;
        validation.settings = enabledValidation.settings;
        validation.errorPath = validationListPath().concat([enabledValidation.index]);
      } else {
        validation.enabled = false;
        validation.errorPath = [];
      }
    });
  }

  function getFieldValidations() {
    if ($scope.field.type == 'Array')
      return $scope.field.items.validations;
    else
      return $scope.field.validations;
  }

  function getFieldValidation(type) {
    var fieldValidations = getFieldValidations();
    var index = _.findIndex(fieldValidations, function(validation) {
      return validationType(validation) === type;
    });

    if (index == -1)
      return null;

    return {
      index: index,
      settings: fieldValidations[index][type]
    };
  }

  function setFieldValidations(validations) {
    if ($scope.field.type == 'Array')
      $scope.field.items.validations = validations;
    else
      $scope.field.validations = validations;
  }

}]);
