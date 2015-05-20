'use strict';

angular.module('contentful')
.controller('FieldDialogController',
['$scope', '$injector', function ($scope, $injector) {
  var dialog = $scope.dialog;

  var validations = $injector.get('validationDecorator');
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
  var validations = $injector.get('validationDecorator');

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

}]);
