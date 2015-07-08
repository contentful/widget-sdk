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
 *
 * @property {string} $scope.widgetSettings.id
 * @property {object} $scope.widgetSettings.params
 */
.controller('FieldDialogController',
['$scope', '$injector', function FieldDialogController ($scope, $injector) {
  var dialog = $scope.dialog;

  var validations   = $injector.get('validationDecorator');
  var field         = $injector.get('fieldDecorator');
  var trackField    = $injector.get('analyticsEvents').trackField;
  var fieldFactory  = $injector.get('fieldFactory');
  var Widgets       = $injector.get('widgets');

  $scope.decoratedField = field.decorate($scope.field, $scope.contentType);
  $scope.validations = validations.decorateFieldValidations($scope.field);

  $scope.currentTitleField = getTitleField($scope.contentType);

  var eiWidgets = $scope.editingInterface.data.widgets;
  var widget = _.find(eiWidgets, {fieldId: $scope.field.id});

  $scope.widgetSettings = {
    id: widget.widgetId,
    params: _.cloneDeep(widget.widgetParams)
  };


  $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
  $scope.iconId = fieldFactory.getIconId($scope.field)+'-small';

  dialog.save = function () {
    $scope.$broadcast('validate');
    if (!isValid()) {
      trackFieldSettingsError($scope.field);
      return;
    }

    field.update($scope.decoratedField, $scope.field, $scope.contentType);
    validations.updateField($scope.field, $scope.validations);

    var params = $scope.widgetSettings.params;
    var id = $scope.widgetSettings.id;
    _.extend(widget, {
      widgetId: id,
      widgetParams: Widgets.filteredParams(id, params)
    });

    trackFieldSettingsSuccess($scope.field);
    dialog.confirm();
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

  $scope.$watch('widgetSettings.id', function (name) {
    var properWidget = name === 'radio' || name === 'dropdown';
    $scope.showPredefinedValueWidgetHint = !properWidget;
  });

}])


/**
 * @ngdoc type
 * @name FieldDialogAppearanceController
 *
 * @scope.requires {string} widgetSettings.widgetId
 * @scope.requires {object} widgetSettings.widgetParams
 * @scope.requires {UI.Tab} tab
 *
 * @property {Widgets.Descriptor[]}  availableWidgets
 * @property {Widgets.Descriptor}    widget
 * @property {Widgets.Options[]}     widgetOptions
 */
.controller('FieldDialogAppearanceController',
['$scope', '$injector', function ($scope, $injector) {
  var widgets          = $injector.get('widgets');

  $scope.defaultWidgetId = widgets.defaultWidgetId($scope.field, $scope.contentType);
  $scope.widgetParams = $scope.widgetSettings.params;
  $scope.$watch('widgetParams', updateWidgetOptions, true);
  $scope.$watch('widget.options', updateWidgetOptions);

  // when widget parameter is changed, filter option list with dependency check
  widgets.descriptorsForField($scope.field)
  .then(function (available) {
    $scope.availableWidgets = available;
    var selected = _.findIndex(available, {id: $scope.widgetSettings.id});
    $scope.selectedWidgetIndex = selected;
    $scope.widget = available[selected];
  });

  $scope.selectWidget = function (i) {
    var widget = $scope.availableWidgets[i];
    $scope.selectedWidgetIndex = i;
    $scope.widget = widget;
    $scope.widgetSettings.id = widget.id;
  };

  function updateWidgetOptions () {
    // Loading widgets is asynchronous
    if (!$scope.widget) return;

    var options = $scope.widget.options;
    var params = $scope.widgetParams;
    widgets.applyDefaults(params, options);
    $scope.widgetOptions = widgets.filterOptions(options, params);
  }
}]);
