'use strict';

/**
 * Controls the 'Field Validations' dialog.
 *
 * The controller provides the decorated `scope.fieldValidations` and
 * `scope.fieldItemValidations` arrays and syncs them with the
 * serialized validations of the content type.
 *
 *
 * Decorated Validations
 * =====================
 *
 * A decorated validation is an object that is exposed on the scope in
 * order to simplify editing validations in the views.  A decorated
 * validation has the following form:
 *
 * ~~~
 * {
 *   type: 'identifier',
 *   name: 'A label for the validation',
 *   enabled: false,
 *   settings: settingsValue
 *   views: [viewObject, anotherViewObject],
 *   currentView: 'a name',
 *   errors: ['this validation does not have the correct settings']
 * }
 * ~~~
 *
 * For each available validation of the current field a decorated
 * validation is constructed and added to the `scope.fieldValidations`
 * array. Also if a validation of a given type also exists on the
 * content type, the decorated validation is populated with the
 * settings.
 *
 *
 * Exposed scope functions
 * =======================
 *
 * - `cancel` Closes the underlying dialog.
 * - `save`   Checks if the decorated validation settings are valid,
 *   then converts them to validations for content type fields and
 *   sets them on the field.
 *
 *
 * Required scope properties
 * =========================
 *
 * - `scope.dialog` A `Dialog` instance as created by the modal dialog
 *   service.
 * - `scope.field`  A ContentType field property.
 * - `scope.index`  The index of the field in all Content Type fields.
 * - `scope.otDoc`  ShareJS document for the Content Type.
 */
angular.module('contentful')
.controller('ValidationDialogController',
['$scope', '$injector', function($scope, $injector) {
  var availableValidations    = $injector.get('availableValidations');
  var getErrorMessage         = $injector.get('validationDialogErrorMessages');
  var validationType          = availableValidations.type;
  var logger                  = $injector.get('logger');
  var notification            = $injector.get('notification');
  var createSchema            = $injector.get('validation');
  var validationViews         = $injector.get('validationViews');
  var validationTypesForField = $injector.get('validation').Validation.perType;
  var $q                      = $injector.get('$q');

  var validationSettings = {
    size: {min: null, max: null},
    range: {min: null, max: null},
    dateRange: {after: null, before: null},
    regexp: {pattern: null, flags: null},
    'in': null,
    linkContentType: null,
    linkMimetypeGroup: null,
    assetFileSize: {min: null, max: null},
    assetImageDimensions: { width:  {min: null, max: null},
                            height: {min: null, max: null}}
  };

  var validationsOrder = [
    'size',
    'range',
    'dateRange',
    'regexp',
    'linkContentType',
    'linkMimeType',
    'assetFileSize',
    'in'
  ];

  var validationLabels = {
    size: {
      Text: 'Enforce input length',
      Symbol: 'Enforce input length',
    },
    range: 'Specify allowed number range',
    dateRange: 'Specify allowed date range',
    regexp: 'Match a specific pattern',
    'in': 'Predefined Values',
    linkContentType: 'Specify allowed entry type',
    linkMimetypeGroup: 'Specify allowed file types',
    assetFileSize: 'Specify allowed file size',
    assetImageDimensions: 'Specify image dimensions'
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
    if (validateValidations()) {
      saveToFieldAndOtDoc();
      $scope.dialog.confirm();
    }
  };

  /**
   * Write the scope validations to the OT Document and the Content
   * Type's field.
   *
   * FIXME consolidate code duplication
   */
  function saveToFieldAndOtDoc() {
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
  }

  function getDecoratedValidations(field) {
    var types = _.filter(validationTypesForField(field), function (t) {
      return t in validationSettings;
    });
    var decorated = _.map(types, decorateValidation);
    return _.sortBy(decorated, function(validation) {
      return validationsOrder.indexOf(validation.type);
    });

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
      validation.errors = _.map(errors, function (error) {
        return getErrorMessage(validation.type, error);
      });
      return valid && _.isEmpty(errors);
    }, true);
  }


  function extractDecoratedValidation(validation) {
    var extracted = {};
    extracted[validation.type] = _.cloneDeep(validation.settings);
    if (validation.message)
      extracted.message = validation.message;
    return extracted;
  }

  function extractEnabledValidations(validations) {
    var enabled = _.filter(validations, 'enabled');
    return _.map(enabled, extractDecoratedValidation);
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
      var type = validation.type;
      var enabledValidation = findValidationByType(enabledValidations, type);
      if (enabledValidation) {
        validation.enabled = true;
        validation.settings = _.cloneDeep(enabledValidation[type]);
        validation.message = enabledValidation.message;
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
    return _.find(validations, function(validation) {
      return validationType(validation) === type;
    });
  }

  function getValidationLabel(field, type) {
    if (field.type == 'Array' && type == 'size') {
      var itemType = field.items.type == 'Link' ? field.items.linkType : field.items.type;
      var typePlural = typePlurals[itemType] || itemType + 's';
      return 'Specify number of ' + typePlural;
    }

    var label = validationLabels[type];
    if (!label)
      return type;
    if (typeof label == 'string')
      return label;
    else
      return label[field.type];
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
