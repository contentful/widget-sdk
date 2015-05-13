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
 */
angular.module('contentful')
.controller('ValidationDialogController',
['$scope', '$injector', function($scope, $injector) {
  var track                   = $injector.get('analytics').track;
  var getErrorMessage         = $injector.get('validationDialogErrorMessages');
  var createSchema            = $injector.get('validation');
  var validationViews         = $injector.get('validationViews');
  var validationName          = createSchema.Validation.getName;
  var validationTypesForField = createSchema.Validation.forField;

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
      Object: 'Specify number of properties'
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
  var initiallyEnabled = getValidationEnabledMap();

  $scope.cancel = function() {
    $scope.dialog.cancel();
  };

  $scope.save = function() {
    if (validateValidations()) {
      trackSave();
      saveToField();
      $scope.dialog.confirm();
    } else {
      trackSaveError();
    }
  };

  /**
   * Write the scope validations to the Content Type's field.
   */
  function saveToField() {
    var fieldValidations = extractEnabledValidations($scope.fieldValidations);
    $scope.field.validations = fieldValidations;
    if ($scope.field.items) {
      var fieldItemValidations = extractEnabledValidations($scope.fieldItemValidations);
      $scope.field.items.validations = fieldItemValidations;
    }
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
   * validations `errors` property. This property is deleted otherwise.
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
  function findValidationByType(validations, name) {
    return _.find(validations, function(validation) {
      return validationName(validation) === name;
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
   * @ngdoc analytics-event
   * @name Enabled Validation
   * @param validation
   */
  /**
   * @ngdoc analytics-event
   * @name Disabled Validation
   * @param validation
   */
  /**
   * @ngdoc analytics-event
   * @name Saved Validation Dialog
   * @param validation
   */
  function trackSave () {
    var currentlyEnabled = getValidationEnabledMap();

    _.forEach(currentlyEnabled, function (enabled, name) {
      if (initiallyEnabled[name] !== enabled) {
        if (enabled)
          track('Enabled Validation', {validation: name});
        else
          track('Disabled Validation', {validation: name});
      }
    });
    track('Saved Validation Dialog');
  }


  /**
   * @ngdoc analytics-event
   * @name Save Errored Validation Dialog
   * @description
   * Send this event for each validation that contains an error.
   *
   * @param validation
   */
  function trackSaveError () {
    var validations = $scope.fieldValidations.concat($scope.fieldItemValidations);
    var erroredValidations = _.filter(validations, function(v) {
      return !_.isEmpty(v.errors);
    });
    _.forEach(erroredValidations, function (validation) {
      track('Saved Errored Validation Dialog', {
        validation: validation.name
      });
    });
  }

  /**
   * Returns a map from validation names to booleans, indicating
   * whether they are currently enabled in the scope.
   */
  function getValidationEnabledMap () {
    var enabled = {};
    var validations = $scope.fieldValidations.concat($scope.fieldItemValidations);
    _.forEach(validations, function(validation) {
      enabled[validation.name] = validation.enabled;
    });
    return enabled;
  }
}]);
