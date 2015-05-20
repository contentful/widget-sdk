'use strict';

angular.module('contentful')

.factory('fieldDecorator', ['$injector', function ($injector) {
  var schemas     = $injector.get('validation').schemas;
  var fieldSchema = schemas.ContentType.atItems(['fields']);

  var fieldProperties = [
    'id', 'name', 'apiName',
    'type', 'linkType',
    'localized', 'required', 'disabled'
  ];

  function decorate (field, contentType) {
    var isTitle = (contentType.data.displayField === field.id);
    return _.extend(_.pick(field, fieldProperties), {
      displayName: getDisplayFieldName(field),
      isTitle: isTitle,
      canBeTitle: isTitleField(field.type),
      apiName: field.apiName || field.id
    });
  }

  function extract (decoratedField) {
    return _.pick(decoratedField, fieldProperties);
  }

  function update (decoratedField, field, contentType) {
    _.extend(field, extract(decoratedField));
    var isTitle = decoratedField.isTitle;
    if (isTitle)
      contentType.data.displayField = field.id;
    else if (contentType.data.displayField === field.id && !isTitle)
      contentType.data.displayField = null;
  }

  /**
   * Returns an array of errors for a decorated field.
   */
  function validate (field) {
    return fieldSchema.errors(extract(field));
  }

  return {
    decorate: decorate,
    update:   update,
    validate: validate,
    getDisplayName: getDisplayFieldName
  };

  function isTitleField (fieldType) {
    return fieldType === 'Symbol' || fieldType === 'Text';
  }

  function getDisplayFieldName (field) {
    if (_.isEmpty(field.name)) {
      if ( _.isEmpty(field.id))
        return 'Untitled field';
      else
        return 'ID: ' + field.id;
    } else {
      return field.name;
    }
  }
}])

.factory('validationsDecorator', ['$injector', function ($injector) {
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

  function extractAll (validations) {
    var enabled = _.filter(validations, 'enabled');
    return _.map(enabled, extractOne);
  }

  function extractOne (validation) {
    var extracted = {};
    extracted[validation.type] = _.cloneDeep(validation.settings);
    if (validation.message)
      extracted.message = validation.message;
    return extracted;
  }

  var schema = createSchema({type: 'Validation'});

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

  return {
    decorateFieldValidations: decorateFieldValidations,
    extractAll: extractAll,
    validate:   validate,
    validateAll: validateAll
  };

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
}])


.controller('FieldDialogSettingsController',
['$scope', '$injector', function ($scope, $injector) {
  var fieldDecorator = $injector.get('fieldDecorator');
  var buildMessage = $injector.get('baseErrorMessageBuilder');

  $scope.schema = {
    errors: function (decoratedField) {
      return fieldDecorator.validate(decoratedField);
    },
    buildMessage: function (error) {
      if (error.path && error.path[0] === 'apiName') {
        if (error.name === 'regexp')
          return 'Please use only letters and number';
        if (error.name === 'size')
          return 'Please shorten the text so it’s no longer than 64 characters';
      }
      return buildMessage(error);
    }
  };
  $scope.field = $scope.decoratedField;
  $scope.$watch('fieldSettingsForm.$invalid', function (isInvalid) {
    $scope.tab.invalid = isInvalid;
  });

  $scope.locales = _.map($scope.spaceContext.privateLocales, 'name');
}])

.controller('FieldDialogValidationsController',
['$scope', '$injector', function ($scope, $injector) {
  var validations = $injector.get('validationsDecorator');

  $scope.$watch('fieldValidationsForm.$invalid', function (isInvalid) {
    $scope.tab.invalid = isInvalid;
  });

  $scope.schema = {
    errors: function (decoratedValidation) {
      return validations.validate(decoratedValidation);
    }
  };
}])



.controller('FieldDialogAppearanceController',
['$scope', '$injector', function ($scope, $injector) {
  var widgets          = $injector.get('widgets');
  var getWidgetOptions = widgets.optionsForWidget;
  var buildMessage = $injector.get('baseErrorMessageBuilder');
  var schemaErrors = $injector.get('validation').errors;

  // TODO move this to validation library
  var widgetSchema = {
    type: 'Object',
    properties: {
      id: {
        type: 'Symbol',
        required: true
      },
      widgetParams: {
        type: 'Object',
        properties: {
          helpText: {
            type: 'Text',
            validations: [{size: {max: 300}}]
          }
        },
        additionalProperties: true
      }

    },
    additionalProperties: true
  };


  $scope.$watch('widget.widgetId', function (widgetId) {
    if (widgetId)
      $scope.widgetOptions = getWidgetOptions(widgetId, 'field');
  });

  $scope.$watch('$form.$invalid', function (isInvalid) {
    $scope.tab.invalid = isInvalid;
  });

  $scope.schema = {
    errors: function (widget) {
      return schemaErrors(widget, widgetSchema);
    },
    buildMessage: buildMessage,
  };

  widgets.forField($scope.field)
  .then(function (widgets) {
    $scope.availableWidgets = widgets;
  });

}])


.controller('FieldDialogController',
['$scope', '$injector', function ($scope, $injector) {
  var dialog = $scope.dialog;

  var validations = $injector.get('validationsDecorator');
  var field       = $injector.get('fieldDecorator');

  $scope.decoratedField = field.decorate($scope.field, $scope.contentType);
  $scope.validations = validations.decorateFieldValidations($scope.field);

  $scope.currentTitleField = getTitleField($scope.contentType);

  var widgets = $scope.editingInterface.data.widgets;
  $scope.widget = _.find(widgets, {fieldId: $scope.field.id});

  dialog.save = function () {
    $scope.$broadcast('validate');
    if (isValid()) {
      field.update($scope.decoratedField, $scope.field, $scope.contentType);
      $scope.field.validations = validations.extractAll($scope.validations);
      dialog.confirm();
    }
  };

  function isValid () {
    var fieldErrors = field.validate($scope.decoratedField);
    // TODO this should only check the $valid property
    if (!$scope.fieldForm.$valid || !_.isEmpty(fieldErrors))
      return false;

    if (!_.isEmpty(validations.validateAll($scope.validations)))
      return false;

    return true;
  }

  function getTitleField (ct) {
    var fieldId = ct.data.displayField;
    if (!fieldId || fieldId == $scope.field.id)
      return null;

    var titleField = _.find(ct.data.fields, {id: fieldId});
    return field.getDisplayName(titleField);
  }
}]);
