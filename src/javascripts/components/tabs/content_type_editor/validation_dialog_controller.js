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
  var availableValidations    = $injector.get('availableValidations');
  var validationType          = availableValidations.type;
  var logger                  = $injector.get('logger');
  var notification            = $injector.get('notification');
  var createSchema            = $injector.get('validation');
  var validationViews         = $injector.get('validationViews');
  var validationTypesForField = $injector.get('validation').Validation.perType;
  var $q                      = $injector.get('$q');
  var controller              = this;

  var validationSettings = {
    size: {min: null, max: null},
    range: {min: null, max: null},
    dateRange: {after: null, before: null},
    regexp: {pattern: null, flags: null},
    'in': null,
    linkContentType: null,
    linkMimetypeGroup: null
  };

  var validationLabels = {
    size: 'Length',
    range: 'Numerical Range',
    dateRange: 'Date Range',
    regexp: 'Regular Expression',
    'in': 'Predefined Values',
    linkContentType: 'Content Type',
    linkMimetypeGroup: 'File Type'
  };

  var typePlurals = {
    'Entry': 'Entries'
  };

  // Create decorated validations from field
  $scope.fieldValidations = getDecoratedValidations($scope.field);
  $scope.fieldItemValidations = getDecoratedValidations($scope.field.items || {});

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
   *
   * FIXME consolidate code duplication
   */
  controller.save = function() {
    var fieldValidations = extractEnabledValidations($scope.fieldValidations);
    // TODO field path should be available on scope
    var validationsDoc = $scope.otDoc.at(['fields', $scope.index, 'validations']);
    var updatedFieldValidations =
    validationsDocSet(validationsDoc, fieldValidations)
    .then(function() { $scope.field.validations = fieldValidations; });

    if (!$scope.field.items)
      return updatedFieldValidations;

    var fieldItemValidations = extractEnabledValidations($scope.fieldItemValidations);
    var itemValidationsDoc = $scope.otDoc.at(['fields', $scope.index, 'items', 'validations']);
    var updatedFieldItemValidations =
    validationsDocSet(itemValidationsDoc, fieldItemValidations)
    .then(function() { $scope.field.items.validations = fieldItemValidations; });
    return $q.all(updatedFieldValidations, updatedFieldItemValidations);
  };

  function getDecoratedValidations(field) {
    return _.map(validationTypesForField(field), decorateValidation);

    function decorateValidation(type) {
      var name = getValidationLabel(field, type);
      var settings = _.cloneDeep(validationSettings[type]);
      var views = validationViews.get(type);
      var currentView = views && views[0].name;
      return {
        name: name,
        type: type,
        enabled: false,
        settings: settings,
        views: views,
        currentView: currentView
      };
    }
  }

  function extractDecoratedValidation(validation) {
    var extracted = {};
    extracted[validation.type] = _.cloneDeep(validation.settings);
    return extracted;
  }

  function extractEnabledValidations(validations) {
    var enabled = _.filter(validations, 'enabled');
    return _.map(enabled, extractDecoratedValidation);
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
    var validations = $scope.fieldValidations.concat($scope.fieldItemValidations);
    return _.reduce(validations, function(valid, validation) {
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
   * Sets the 'enabled' and 'settings' properties in the decorated
   * validations to the values obtained from `field.validaitons`.
   */
  function updateValidationsFromField() {
    updateDecoratedValidations($scope.fieldValidations, $scope.field.validations);
    updateDecoratedValidations($scope.fieldItemValidations, ($scope.field.items || {}).validations);
  }

  function updateDecoratedValidations(validations, enabledValidations) {
    _.forEach(validations, function(validation) {
      var enabledValidation = findValidationByType(enabledValidations, validation.type);
      if (enabledValidation) {
        validation.enabled = true;
        validation.settings = _.cloneDeep(enabledValidation.settings);
      } else {
        validation.enabled = false;
      }
    });
  }

  /**
   * Return the index and the settings for the validation of type
   * `type` from a list of `validations`.
   */
  function findValidationByType(validations, type) {
    var index = _.findIndex(validations, function(validation) {
      return validationType(validation) === type;
    });

    if (index == -1)
      return null;

    return {
      index: index,
      settings: validations[index][type]
    };
  }

  function getValidationLabel(field, type) {
    if (field.type == 'Array' && type == 'size') {
      var itemType = field.items.type == 'Link' ? field.items.linkType : field.items.type;
      var typePlural = typePlurals[itemType] || itemType + 's';
      return 'Enforce number of ' + typePlural;
    } else {
      return validationLabels[type];
    }
  }

  /**
   * Run `otDoc.set(validations)` and return a promise.
   *
   * Also logs errors thrown by the method.
   */
  function validationsDocSet(otDoc, validations) {
    return $q(function(resolve, reject) {
      otDoc.set(validations, function(error) {
        if (error) {
          logger.logServerWarn('Could not save validations', {error: error });
          notification.error('Could not save validations');
          reject(error);
        }
        else {
          resolve();
        }
      });
    });
  }
}]);
