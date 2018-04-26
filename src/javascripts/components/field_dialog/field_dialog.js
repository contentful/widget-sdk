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
  var WidgetParametersUtils = require('widgets/WidgetParametersUtils');
  var spaceContext = require('spaceContext');
  var $timeout = require('$timeout');
  var notification = require('notification');

  var contentTypeData = $scope.contentType.data;

  $scope.decoratedField = fieldDecorator.decorate($scope.field, contentTypeData);

  $scope.validations = validations.decorateFieldValidations($scope.field);

  $scope.currentTitleField = getTitleField();

  var initialWidgetId = $scope.widget.widgetId;

  $scope.widgetSettings = {
    id: $scope.widget.widgetId,
    // Need to clone so we do not mutate data if we cancel the dialog
    params: _.cloneDeep($scope.widget.settings || {})
  };

  $scope.$watch('widgetSettings.id', reposition);
  $scope.$watch(function () {
    return $scope.tabController.getActiveTabName();
  }, reposition);

  function reposition () {
    $timeout(function () {
      $scope.$emit('centerOn:reposition');
    });
  }

  /**
   * @ngdoc property
   * @name FieldDialogController#availableWidgets
   * @type {Widgets.Descriptor[]}
   */
  spaceContext.widgets.refresh().then(function (widgets) {
    var fieldType = fieldFactory.getTypeName($scope.field);

    $scope.availableWidgets = widgets.filter(function (widget) {
      return widget.fieldTypes.includes(fieldType);
    });
  });

  $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
  $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

  dialog.save = function () {
    $scope.$broadcast('validate');
    if (!isValid()) {
      notification.error('Please check the form for validation errors.');
      return;
    }

    fieldDecorator.update($scope.decoratedField, $scope.field, contentTypeData);
    validations.updateField($scope.field, $scope.validations);

    var widgetId = $scope.widgetSettings.id;
    var values = $scope.widgetSettings.params;
    var selectedWidget = _.find($scope.availableWidgets, {id: widgetId});
    var definitions = _.get(selectedWidget, ['parameters']) || [];

    definitions = WidgetParametersUtils.filterDefinitions(definitions, values, selectedWidget);
    values = WidgetParametersUtils.filterValues(definitions, values);
    $scope.widgetSettings.params = values;

    var missing = WidgetParametersUtils.markMissingValues(definitions, values);
    var hasMissingParameters = Object.keys(missing).some(function (key) {
      return missing[key] === true;
    });

    if (hasMissingParameters) {
      notification.error('Please provide all required parameters.');
      return;
    }

    _.extend($scope.widget, {
      widgetId: widgetId,
      fieldId: $scope.field.apiName,
      settings: values
    });

    if (widgetId !== initialWidgetId) {
      trackCustomWidgets.selected($scope.widget, $scope.field, $scope.contentType);
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
  var getDefaultWidgetId = require('widgets/default');

  $scope.defaultWidgetId = getDefaultWidgetId($scope.field, $scope.contentType.data.displayField);
  $scope.selectWidget = selectWidget;

  $scope.$watch('availableWidgets', function (available) {
    if (Array.isArray(available)) {
      var selected = _.findIndex(available, {id: $scope.widgetSettings.id});
      selectWidget(selected > -1 ? selected : 0);
    }
  });

  function selectWidget (i) {
    var widget = $scope.availableWidgets[i];
    $scope.selectedWidgetIndex = i;
    $scope.widgetSettings.id = widget.id;
  }
}])

.directive('cfFieldAppearanceParameters', ['require', function (require) {
  var ReactDOM = require('react-dom');
  var React = require('react');
  var WidgetParametersUtils = require('widgets/WidgetParametersUtils');
  var WidgetParametersForm = require('widgets/WidgetParametersForm').default;

  return {
    restrict: 'E',
    template: '<div class="mount-point"></div>',
    link: function (scope, el) {
      render();
      scope.$watch('widgetSettings.id', render);
      scope.$watch('availableWidgets', render);

      function render () {
        var widget = _.find(scope.availableWidgets, {id: scope.widgetSettings.id});
        if (widget) {
          ReactDOM.render(
            React.createElement(WidgetParametersForm, prepareProps(widget)),
            el[0].querySelector('.mount-point')
          );
        }
      }

      function prepareProps (widget) {
        var definitions = widget.parameters;
        var settings = scope.widgetSettings;

        settings.params = WidgetParametersUtils.applyDefaultValues(definitions, settings.params);
        definitions = WidgetParametersUtils.filterDefinitions(definitions, settings.params, widget);
        definitions = WidgetParametersUtils.unifyEnumOptions(definitions);

        return {
          definitions: definitions,
          values: settings.params,
          missing: WidgetParametersUtils.markMissingValues(definitions, settings.params),
          updateValue: updateValue
        };
      }

      function updateValue (id, value) {
        scope.widgetSettings.params[id] = value;
        scope.$applyAsync();
        render();
      }
    }
  };
}]);
