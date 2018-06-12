'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name validationDecorator
 */
.factory('validationDecorator', ['require', require => {
  var pluralize = require('pluralize');
  var validationViews = require('validationViews');
  var createSchema = require('validation');
  var getErrorMessage = require('validationDialogErrorMessages');

  var validationName = createSchema.Validation.getName;
  var validationTypesForField = createSchema.Validation.forField;

  var validationSettings = {
    size: {min: null, max: null},
    range: {min: null, max: null},
    dateRange: {after: null, before: null},
    regexp: {pattern: null, flags: null},
    in: null,
    unique: true,
    linkContentType: null,
    linkMimetypeGroup: null,
    assetFileSize: {min: null, max: null},
    assetImageDimensions: {
      width: { min: null, max: null },
      height: {min: null, max: null}
    }
  };

  var validationLabels = {
    size: {
      Text: 'Limit character count',
      Symbol: 'Limit character count',
      Object: 'Limit number of properties'
    },
    range: 'Accept only specified number range',
    dateRange: 'Accept only specified date range',
    regexp: 'Match a specific pattern',
    unique: 'Unique field',
    in: 'Accept only specified values',
    linkContentType: 'Accept only specified entry type',
    linkMimetypeGroup: 'Accept only specified file types',
    assetFileSize: 'Accept only specified file size',
    assetImageDimensions: 'Accept only specified image dimensions'
  };

  var validationHelpText = {
    size: {
      Text: 'Specify a minimum and/or maximum allowed number of characters',
      Symbol: 'Specify a minimum and/or maximum allowed number of characters',
      Object: 'Specify a minimum and/or maximum allowed number of properties'
    },
    range: 'Specify a minimum and/or maximum allowed number for this field',
    dateRange: 'Specify an early and/or latest allowed date for this field',
    regexp: 'Make this field match a pattern: e-mail address, URI, or a custom regular expression',
    unique: 'You won\'t be able to publish an entry if there is an existing entry with identical content',
    in: 'You won\'t be able to publish an entry if the field value is not in the list of specified values',
    linkContentType: 'Make this field only accept entries from specified content type(s)',
    linkMimetypeGroup: 'Make this field only accept specified file types',
    assetFileSize: 'Specify a minimum and/or maximum allowed file size',
    assetImageDimensions: 'Specify a minimum and/or maximum allowed image dimension'
  };


  var validationsOrder = [
    'unique',
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
    extractAll: extractAll,
    validate: validate,
    validateAll: validateAll,
    updateField: updateField
  };

  /**
   * @ngdoc method
   * @name validationDecorator#decorateFieldValidations
   * @param {Field} field
   * @returns {DecoratedValidation[]}
   */
  function decorateFieldValidations (field) {
    var types = _.filter(validationTypesForField(field), t => t in validationSettings);

    var fieldValidations = _.map(types, validationDecorator(field));

    if (field.items) {
      var itemValidations = decorateFieldValidations(field.items);
      _.each(itemValidations, v => {
        v.onItems = true;
      });

      // remove unique validation for items as we don't support
      // it for items nor for the Array container type
      itemValidations = _.filter(itemValidations, validation => validation.type !== 'unique');

      fieldValidations = itemValidations.concat(fieldValidations);
    }

    return _.sortBy(fieldValidations, validation => validationsOrder.indexOf(validation.type));
  }

  function validationDecorator (field) {
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
      var helpText = getValidationHelpText(field, type);

      return {
        name: name,
        helpText: helpText,
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
    if (decorated.message) {
      extracted.message = decorated.message;
    }
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

    return _.forEach(errors, error => {
      error.path = [];
      error.message = getErrorMessage(validation.type, error);
    });
  }

  /**
   * @ngdoc method
   * @name validationDecorator#updateField
   * @description
   * Set the fields validations by extracting all enabled decorated
   * validations.
   *
   * This is the inverse of `decorateFieldValidations`.
   *
   * @param {ContentType.Field} field
   * @param {DecoratedValdiation[]} validations
   */
  function updateField (field, validations) {
    var baseValidations = _.filter(validations, {onItems: false});
    var itemValidations = _.filter(validations, {onItems: true});

    field.validations = extractAll(baseValidations);
    if (!_.isEmpty(itemValidations)) {
      field.items.validations = extractAll(itemValidations);
    }
  }

  function validateAll (decoratedValidations) {
    return _.reduce(decoratedValidations, (allErrors, validation, index) => {
      var errors = validate(validation);
      _.forEach(errors, error => {
        error.path = [index].concat(error.path);
      });
      return allErrors.concat(errors);
    }, []);
  }

  /**
   * Return the index and the settings for the validation of type
   * `type` from a list of `validations`.
   */
  function findValidationByType (validations, name) {
    return _.find(validations, validation => validationName(validation) === name);
  }

  function getValidationLabel (field, type) {
    if (field.type === 'Array' && type === 'size') {
      var itemTypes = pluralize((field.items.linkType || field.items.type).toLowerCase());

      return 'Accept only a specified number of ' + itemTypes;
    }

    return getValidationStringForType(validationLabels, field, type);
  }

  function getValidationHelpText (field, type) {
    if (field.type === 'Array' && type === 'size') {
      var itemTypes = pluralize((field.items.linkType || field.items.type).toLowerCase());

      return 'Specify a minimum and/or maximum allowed number of ' + itemTypes;
    }

    return getValidationStringForType(validationHelpText, field, type);
  }

  function getValidationStringForType (object, field, type) {
    var label = object[type];

    if (!label) {
      return type;
    } else if (_.isString(label)) {
      return label;
    } else {
      return label[field.type];
    }
  }
}]);
