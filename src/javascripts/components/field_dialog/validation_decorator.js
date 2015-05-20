'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name validationDecorator
 */
.factory('validationDecorator', ['$injector', function ($injector) {
  var pluralize               = $injector.get('pluralize');
  var validationViews         = $injector.get('validationViews');
  var createSchema            = $injector.get('validation');
  var getErrorMessage         = $injector.get('validationDialogErrorMessages');
  var validationName          = createSchema.Validation.getName;
  var validationTypesForField = createSchema.Validation.forField;

  var validationSettings = {
    size: {min: null, max: null},
    range: {min: null, max: null},
    dateRange: {after: null, before: null},
    regexp: {pattern: null, flags: null},
    in: null,
    linkContentType: null,
    linkMimetypeGroup: null,
    assetFileSize: {min: null, max: null},
    assetImageDimensions: { width:  {min: null, max: null},
                            height: {min: null, max: null}}
  };

  var validationLabels = {
    size: {
      Text:   'Specify number of characters',
      Symbol: 'Specify number of characters',
      Object: 'Specify number of properties'
    },
    range: 'Specify allowed number range',
    dateRange: 'Specify allowed date range',
    regexp: 'Match a specific pattern',
    in: 'Predefined Values',
    linkContentType: 'Specify allowed entry type',
    linkMimetypeGroup: 'Specify allowed file types',
    assetFileSize: 'Specify allowed file size',
    assetImageDimensions: 'Specify image dimensions'
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

  var schema = createSchema({type: 'Validation'});

  return {
    decorateFieldValidations: decorateFieldValidations,
    extractAll:  extractAll,
    validate:    validate,
    validateAll: validateAll
  };

  /**
   * @ngdoc method
   * @name validationDecorator#decorateFieldValidations
   * @param {Field} field
   * @returns {DecoratedValidation[]}
   */
  function decorateFieldValidations(field) {
    var types = _.filter(validationTypesForField(field), function (t) {
      return t in validationSettings;
    });
    var fieldValidations = _.map(types, validationDecorator(field));

    if (field.items) {
      var itemValidations = decorateFieldValidations(field.items);
      _.each(itemValidations, function (v) {
        v.onItems = true;
      });
      fieldValidations = itemValidations.concat(fieldValidations);
    }

    return _.sortBy(fieldValidations, function(validation) {
      return validationsOrder.indexOf(validation.type);
    });
  }

  function validationDecorator(field) {
    return function decorateValidation (type) {
      var fieldValidation = findValidationByType(field.validations, type);

      var settings, enabled, message;

      if (fieldValidation) {
        enabled = true;
        settings = fieldValidation[type];
        message = fieldValidation.message;
      } else {
        enabled = false;
        settings = validationSettings[type];
        message = null;
      }

      var name = getValidationLabel(field, type);
      var views = validationViews.get(type);
      var currentView = views && views[0].name;

      return {
        name: name,
        type: type,
        onItems: false,
        enabled: enabled,
        message: message,
        settings: _.cloneDeep(settings),
        views: views,
        currentView: currentView
      };
    };
  }


  /**
   * @ngdoc method
   * @name validationDecorator#extractAll
   * @param {DecoratedValidation[]} decorated
   * @returns {Validation[]}
   */
  function extractAll (decorated) {
    var enabled = _.filter(decorated, 'enabled');
    return _.map(enabled, extractOne);
  }

  function extractOne (decorated) {
    var extracted = {};
    extracted[decorated.type] = _.cloneDeep(decorated.settings);
    if (decorated.message)
      extracted.message = decorated.message;
    return extracted;
  }

  /**
   * @ngdoc method
   * @name validationDecorator#validate
   * @param {DecoratedValidation} validation
   * @return {Error[]}
   */
  function validate (validation) {
    var errors = [];
    if (validation.enabled) {
      errors = schema.errors(extractOne(validation));
    }

    return _.forEach(errors, function (error) {
      error.path = [];
      error.message = getErrorMessage(validation.type, error);
    });
  }

  function validateAll (decoratedValidations) {
    return _.reduce(decoratedValidations, function (allErrors, validation, index) {
      var errors = validate(validation);
      _.forEach(errors, function (error) {
        error.path = [index].concat(error.path);
      });
      return allErrors.concat(errors);
    }, []);
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
      return 'Specify number of ' + pluralize(itemType);
    }

    var label = validationLabels[type];
    if (!label)
      return type;
    if (typeof label == 'string')
      return label;
    else
      return label[field.type];
  }
}]);
