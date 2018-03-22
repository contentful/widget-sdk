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
 * @param {Client.ContentType.Field} field
 * @param {API.Widget}               widget
 * @return {Promise<void>}
 */
.factory('openFieldDialog', ['require', function (require) {
  var modalDialog = require('modalDialog');

  return function openFieldDialog ($scope, field, widget) {
    var scope = _.extend($scope.$new(), {
      field: field,
      widget: widget
    });
    return modalDialog.open({
      scope: scope,
      template: 'field_dialog'
    }).promise;
  };
}])

/**
 * @ngdoc type
 * @name FieldDialogController
 *
 * @scope.requires {Client.ContentType.Field}  field
 * @scope.requires {Client.ContentType}        contentType
 * @scope.requires {API.EditingInterface}      editingInterface
 *
 * @property {string} $scope.widgetSettings.id
 * @property {object} $scope.widgetSettings.params
 */
.controller('FieldDialogController', ['$scope', 'require', function FieldDialogController ($scope, require) {
  var dialog = $scope.dialog;

  var validations = require('validationDecorator');
  var fieldDecorator = require('fieldDecorator');
  var trackCustomWidgets = require('analyticsEvents/customWidgets');
  var fieldFactory = require('fieldFactory');
  var Widgets = require('widgets');

  var contentTypeData = $scope.contentType.data;

  $scope.decoratedField = fieldDecorator.decorate($scope.field, contentTypeData);

  $scope.validations = validations.decorateFieldValidations($scope.field);

  $scope.currentTitleField = getTitleField();

  var widget = $scope.widget;
  var initialWidgetId = widget.widgetId;

  $scope.widgetSettings = {
    id: widget.widgetId,
    // Need to clone so we do not mutate data if we cancel the dialog
    params: _.cloneDeep(widget.settings || {})
  };


  /**
   * @ngdoc property
   * @name FieldDialogController#availableWidgets
   * @type {Widgets.Descriptor[]}
   */
  Widgets.getAvailable($scope.field)
  .then(function (available) {
    $scope.availableWidgets = available;
  });


  $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
  $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

  dialog.save = function () {
    $scope.$broadcast('validate');
    if (!isValid()) {
      return;
    }

    fieldDecorator.update($scope.decoratedField, $scope.field, contentTypeData);
    validations.updateField($scope.field, $scope.validations);

    var params = $scope.widgetSettings.params;
    var widgetId = $scope.widgetSettings.id;
    _.extend(widget, {
      widgetId: widgetId,
      fieldId: $scope.field.apiName,
      settings: Widgets.filteredParams(widgetId, params)
    });

    if (widgetId !== initialWidgetId) {
      trackCustomWidgets.selected(widget, $scope.field, $scope.contentType);
    }

    dialog.confirm();
  };

  function isValid () {
    if (!$scope.fieldForm.$valid) {
      return false;
    }

    if (!_.isEmpty(validations.validateAll($scope.validations))) {
      return false;
    }

    return true;
  }

  function getTitleField () {
    var fieldId = contentTypeData.displayField;
    if (!fieldId || fieldId === $scope.field.id) {
      return null;
    }

    var titleField = _.find(contentTypeData.fields, {id: fieldId});
    return fieldDecorator.getDisplayName(titleField);
  }
}])


.controller('FieldDialogSettingsController', ['$scope', 'require', function ($scope, require) {
  var fieldDecorator = require('fieldDecorator');
  var buildMessage = require('fieldErrorMessageBuilder');
  var TheLocaleStore = require('TheLocaleStore');

  $scope.schema = {
    errors: function (decoratedField) {
      return fieldDecorator.validateInContentType(decoratedField, $scope.contentType.data);
    },
    buildMessage: buildMessage
  };
  $scope.field = $scope.decoratedField;
  $scope.$watch('fieldSettingsForm.$invalid', function (isInvalid) {
    $scope.tab.invalid = isInvalid;
  });

  $scope.locales = _.map(TheLocaleStore.getPrivateLocales(), 'name');
}])


/**
 * @ngdoc type
 * @name FieldDialogValidationsController
 *
 * @scope.requires {string}  widgetSettings.id
 * @scope.requires {Widgets.Descriptor[]}  availableWidgets
 */
.controller('FieldDialogValidationsController', ['$scope', 'require', function ($scope, require) {
  var validations = require('validationDecorator');

  $scope.$watch('fieldValidationsForm.$invalid', function (isInvalid) {
    $scope.tab.invalid = isInvalid;
  });

  $scope.schema = {
    errors: function (decoratedValidation) {
      return validations.validate(decoratedValidation);
    }
  };

  /**
   * @ngdoc property
   * @name FieldDialogValidationsController#showPredefinedValueWidgetHint
   * @type {boolean}
   */
  $scope.$watchGroup(['widgetSettings.id', 'availableWidgets'], function (values) {
    var name = values[0];
    var available = values[1];
    var properWidgets = ['radio', 'dropdown', 'checkbox'];

    var isProper = _.includes(properWidgets, name);
    var availableIds = _.map(available, 'id');
    var properAvailable = _.intersection(availableIds, properWidgets).length;
    $scope.showPredefinedValueWidgetHint = !isProper && properAvailable;
  });
}])


/**
 * @ngdoc type
 * @name FieldDialogAppearanceController
 *
 * @scope.requires {string} widgetSettings.id
 * @scope.requires {object} widgetSettings.params
 * @scope.requires {UI.Tab} tab
 * @scope.requires {Widgets.Descriptor[]}  availableWidgets
 *
 * @property {Widgets.Descriptor}    widget
 * @property {Widgets.Options[]}     widgetOptions
 */
.controller('FieldDialogAppearanceController', ['$scope', 'require', function ($scope, require) {
  var Widgets = require('widgets');
  var getDefaultWidgetId = require('widgets/default');

  $scope.defaultWidgetId = getDefaultWidgetId($scope.field, $scope.contentType.data.displayField);
  $scope.widgetParams = $scope.widgetSettings.params;
  $scope.$watch('widgetParams', updateOptionsAndParams, true);
  $scope.$watch('widget.id', updateOptionsAndParams);

  $scope.$watch('availableWidgets', function (available) {
    if (!available) { return; }
    var selected = _.findIndex(available, {id: $scope.widgetSettings.id});
    if (selected < 0) {
      selected = 0;
    }
    $scope.selectWidget(selected);
  });

  $scope.selectWidget = function (i) {
    var widget = $scope.availableWidgets[i];
    $scope.selectedWidgetIndex = i;
    $scope.widget = widget;
    $scope.widgetSettings.id = widget.id;
  };

  function updateOptionsAndParams () {
    var widget = $scope.widget;
    if (widget) {
      var params = $scope.widgetParams;
      Widgets.applyDefaults(widget.id, params);
      $scope.widgetOptions = Widgets.filterOptions(widget, params);
    }
  }
}]);
