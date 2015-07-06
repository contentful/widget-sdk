'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name openFieldDialog
 *
 * @description
 * Opens a the editing dialog for the given field and returns a promise
 * that resolves when the field is updated.
 *
 * @param {Scope}                    $scope
 * @param {Client.ContentType}       $scope.contentType
 * @param {Client.EditingInterface}  $scope.editingInterface
 * @param {Client.ContentType.Field} field
 * @return {Promise<void>}
 */
.factory('openFieldDialog', ['$injector', function ($injector) {
  var analytics = $injector.get('analyticsEvents');
  var modalDialog  = $injector.get('modalDialog');

  return function openFieldDialog($scope, field) {
    var scope = $scope.$new();
    _.extend(scope, {field: field});
    trackOpenSettingsDialog(field);
    return modalDialog.open({
      scope: scope,
      template: 'field_dialog',
      ignoreEnter: true
    }).promise;
  };


  /**
   * @ngdoc analytics-event
   * @name Clicked Field Settings Button
   * @param fieldId
   * @param originatingFieldType
   */
  function trackOpenSettingsDialog (field) {
    analytics.trackField('Clicked Field Settings Button', field);
  }
}])

/**
 * @ngdoc type
 * @name FieldDialogController
 *
 * @scope.requires {Client.ContentType.Field}  field
 * @scope.requires {Client.ContentType}        contentType
 * @scope.requires {Client.EditingInterface}   editingInterface
 */
.controller('FieldDialogController',
['$scope', '$injector', function ($scope, $injector) {
  var dialog = $scope.dialog;

  var validations   = $injector.get('validationDecorator');
  var field         = $injector.get('fieldDecorator');
  var trackField    = $injector.get('analyticsEvents').trackField;
  var fieldFactory  = $injector.get('fieldFactory');

  $scope.decoratedField = field.decorate($scope.field, $scope.contentType);
  $scope.validations = validations.decorateFieldValidations($scope.field);

  $scope.currentTitleField = getTitleField($scope.contentType);

  var widgets = $scope.editingInterface.data.widgets;
  $scope.widget = _.clone(_.find(widgets, {fieldId: $scope.field.id}));

  $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
  $scope.iconId = fieldFactory.getIconId($scope.field)+'-small';

  dialog.save = function () {
    $scope.$broadcast('validate');
    if (isValid()) {
      field.update($scope.decoratedField, $scope.field, $scope.contentType);
      validations.updateField($scope.field, $scope.validations);
      var widgetIndex = _.findIndex(widgets, {fieldId: $scope.field.id});
      widgets[widgetIndex] = $scope.widget;
      trackFieldSettingsSuccess($scope.field);
      dialog.confirm();
    } else {
      trackFieldSettingsError($scope.field);
    }
  };

  function isValid () {
    if (!$scope.fieldForm.$valid)
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


  /**
   * @ngdoc analytics-event
   * @name Saved Errored Field Settings Modal
   * @param fieldId
   * @param originatingFieldType
   */
  function trackFieldSettingsError (field) {
    trackField('Saved Errored Field Settings Modal', field);
  }

  /**
   * @ngdoc analytics-event
   * @name Saved Successful Field Settings Modal
   * @param fieldId
   * @param originatingFieldType
   */
  function trackFieldSettingsSuccess (field) {
    trackField('Saved Successful Field Settings Modal', field);
  }

}])


.controller('FieldDialogSettingsController',
['$scope', '$injector', function ($scope, $injector) {
  var fieldDecorator = $injector.get('fieldDecorator');
  var buildMessage = $injector.get('fieldErrorMessageBuilder');

  $scope.schema = {
    errors: function (decoratedField) {
      return fieldDecorator.validateInContentType(decoratedField, $scope.contentType);
    },
    buildMessage: buildMessage,
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

  $scope.$watch('widget.widgetId', function (name) {
    var properWidget = name === 'radio' || name === 'dropdown';
    $scope.showPredefinedValueWidgetHint = !properWidget;
  });

}])


.controller('FieldDialogAppearanceController',
['$scope', '$injector', function ($scope, $injector) {
  var widgets          = $injector.get('widgets');
  var widgetChecks     = $injector.get('widgetChecks');
  var fieldFactory     = $injector.get('fieldFactory');
  var buildMessage     = $injector.get('baseErrorMessageBuilder');
  var widgetOptions;

  $scope.$watch('widget', function(widget) {
    if (widget && widget.widgetId) {
      widgets.applyDefaults(widget);
      $scope.defaultWidget = fieldFactory.getDefaultWidget($scope.field);
    }
  });

  $scope.$watch('widget.widgetId', function (widgetId) {
    if (widgetId) {
      widgetOptions = widgets.optionsForWidget(widgetId, 'field');
      updateWidgetOptions($scope.widgetParams);
      setSelectedWidgetIndex(widgetId);
    }
  });

  // when widget parameter is changed, filter option list with dependency check
  $scope.$watch('widget.widgetParams', updateWidgetOptions, true);

  $scope.$watch('$form.$invalid', function (isInvalid) {
    $scope.tab.invalid = isInvalid;
  });

  $scope.schema = {
    errors: widgets.validate,
    buildMessage: buildMessage
  };

  $scope.selectWidget = function (id) {
    $scope.widget.widgetId = id;
  };

  widgets.forField($scope.field)
  .then(widgetChecks.markMisconfigured)
  .then(function (widgets) {
    $scope.availableWidgets = widgets;
    $scope.misconfiguredMap = widgetChecks.getMisconfigured(widgets);
    $scope.deprecatedMap = widgetChecks.getDeprecated();
    setSelectedWidgetIndex($scope.widget.widgetId);
  });

  function setSelectedWidgetIndex(widgetId) {
    $scope.selectedWidgetIndex = _.findIndex($scope.availableWidgets, {id: widgetId});
  }

  function updateWidgetOptions(params) {
    $scope.widgetOptions = widgets.filterOptions(widgetOptions || [], params);
  }
}]);
