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
  var createSchema         = $injector.get('validation');
  var validationViews      = $injector.get('validationViews');
  var controller           = this;

  // Create decorated validations from field
  var availableFieldValidations = availableValidations.forField($scope.field);
  $scope.validations = _.map(availableFieldValidations, decorateValidation);
  updateValidationsFromField();
  validateValidations();

  $scope.cancel = function() {
    $scope.dialog.cancel();
  };

  $scope.save = function() {
    var valid = validateValidations();
    if (valid) {
      controller.save();
      $scope.dialog.confirm();
    }
  };

  /**
   * Write the scope validations to the OT Document and the Content
   * Type's field.
   */
  controller.save = function() {
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
    var views = validationViews.get(type);
    var currentView = views && views[0].name;
    return {
      name: validationName(backendValidation),
      type: type,
      enabled: false,
      settings: settings,
      views: views,
      currentView: currentView
    };
  }

  function extractDecoratedValidation(validation) {
    var extracted = {};
    extracted[validation.type] = _.cloneDeep(validation.settings);
    return extracted;
  }

  function validationListPath() {
    if ($scope.field.type == 'Array')
      return ['fields', $scope.index, 'items', 'validations'];
    else
      return ['fields', $scope.index, 'validations'];
  }

  /**
   * Validates each enabled validation.
   *
   * If the validation fails, the errors are added to decorated
   * validations `errors` property. This property is delted otherwise.
   *
   * Returns `true` if and only if all validations are valid.
   */
  function validateValidations() {
    var schema = createSchema({type: 'Validation'});
    return _.reduce($scope.validations, function(valid, validation) {
      if (!validation.enabled) {
        delete validation.errors;
        return valid;
      }

      var errors = schema.errors(extractDecoratedValidation(validation));
      validation.errors = _.map(errors, 'details');
      return valid && _.isEmpty(errors);
    }, true);
  }


  /**
   * Sets the 'enabled' flag for the decorated validations according to
   * their presence in `field.validations`.
   */
  function updateValidationsFromField() {
    _.forEach($scope.validations, function(validation) {
      var enabledValidation = getFieldValidation(validation.type);
      if (enabledValidation) {
        validation.enabled = true;
        validation.settings = _.cloneDeep(enabledValidation.settings);
      } else {
        validation.enabled = false;
      }
    });
  }

  function getFieldValidations() {
    if ($scope.field.type == 'Array')
      return $scope.field.items.validations;
    else
      return $scope.field.validations;
  }

  /**
   * Return the index and the settings for the validation of type
   * `type` from `scope.field.validations`.
   */
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
