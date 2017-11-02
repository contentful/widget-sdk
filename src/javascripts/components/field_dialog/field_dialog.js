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
.factory('openFieldDialog', ['$injector', function ($injector) {
  var modalDialog = $injector.get('modalDialog');

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
.controller('FieldDialogController', ['$scope', '$injector', function FieldDialogController ($scope, $injector) {
  var dialog = $scope.dialog;

  var validations = $injector.get('validationDecorator');
  var field = $injector.get('fieldDecorator');
  var trackCustomWidgets = $injector.get('analyticsEvents/customWidgets');
  var fieldFactory = $injector.get('fieldFactory');
  var Widgets = $injector.get('widgets');

  $scope.decoratedField = field.decorate($scope.field, $scope.contentType);

  $scope.validations = validations.decorateFieldValidations($scope.field);

  $scope.currentTitleField = getTitleField($scope.contentType);

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
  var currentWidgetId = widget.widgetId;
  Widgets.getAvailable($scope.field, currentWidgetId)
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

    field.update($scope.decoratedField, $scope.field, $scope.contentType);
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

  function getTitleField (ct) {
    var fieldId = ct.data.displayField;
    if (!fieldId || fieldId === $scope.field.id) {
      return null;
    }

    var titleField = _.find(ct.data.fields, {id: fieldId});
    return field.getDisplayName(titleField);
  }
}])


.controller('FieldDialogSettingsController', ['$scope', '$injector', function ($scope, $injector) {
  var fieldDecorator = $injector.get('fieldDecorator');
  var buildMessage = $injector.get('fieldErrorMessageBuilder');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  $scope.schema = {
    errors: function (decoratedField) {
      return fieldDecorator.validateInContentType(decoratedField, $scope.contentType);
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
.controller('FieldDialogValidationsController', ['$scope', '$injector', function ($scope, $injector) {
  var validations = $injector.get('validationDecorator');

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
.controller('FieldDialogAppearanceController', ['$scope', '$injector', function ($scope, $injector) {
  var Widgets = $injector.get('widgets');
  var getDefaultWidgetId = $injector.get('widgets/default');

  $scope.defaultWidgetId = getDefaultWidgetId($scope.field, $scope.contentType);
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
      $scope.widgetOptions = Widgets.filterOptions(widget.options, params);
    }
  }
}]);
