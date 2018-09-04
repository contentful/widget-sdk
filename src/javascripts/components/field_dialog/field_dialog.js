'use strict';

angular
  .module('contentful')

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
  .factory('openFieldDialog', [
    'require',
    require => {
      const modalDialog = require('modalDialog');

      return function openFieldDialog($scope, field, widget) {
        const scope = _.extend($scope.$new(), {
          field: field,
          widget: widget
        });
        return modalDialog.open({
          scope: scope,
          template: 'field_dialog'
        }).promise;
      };
    }
  ])

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
  .controller('FieldDialogController', [
    '$scope',
    'require',
    function FieldDialogController($scope, require) {
      const dialog = $scope.dialog;

      const validations = require('validationDecorator');
      const fieldDecorator = require('fieldDecorator');
      const trackCustomWidgets = require('analyticsEvents/customWidgets');
      const fieldFactory = require('fieldFactory');
      const WidgetParametersUtils = require('widgets/WidgetParametersUtils.es6');
      const spaceContext = require('spaceContext');
      const $timeout = require('$timeout');
      const notification = require('notification');

      const contentTypeData = $scope.contentType.data;

      $scope.decoratedField = fieldDecorator.decorate($scope.field, contentTypeData);

      $scope.validations = validations.decorateFieldValidations($scope.field);

      $scope.currentTitleField = getTitleField();

      const initialWidgetId = $scope.widget.widgetId;

      $scope.widgetSettings = {
        id: $scope.widget.widgetId,
        // Need to clone so we do not mutate data if we cancel the dialog
        params: _.cloneDeep($scope.widget.settings || {})
      };

      $scope.$watch('widgetSettings.id', reposition);
      $scope.$watch(() => $scope.tabController.getActiveTabName(), reposition);

      $scope.buildRequiredCheckboxProps = () => ({
        id: 'field-validations--required',
        labelText: 'Required field',
        checked: $scope.decoratedField.required,
        helpText: "You won't be able to publish an entry if this field is empty",
        extraClassNames: 'validation-checkboxfield',
        onChange: e => {
          $scope.decoratedField.required = e.target.checked;
          $scope.$digest();
        }
      });

      $scope.buildValidationCheckboxProps = validation => ({
        id: `field-validations--${validation.type}`,
        labelText: validation.name,
        checked: validation.enabled,
        helpText: validation.helpText,
        extraClassNames: 'validation-checkboxfield',
        checkboxProps: {
          name: 'isthisenabled',
          'aria-label': `${validation.enabled ? 'Disable' : 'Enable'} validation`
        },
        onChange: e => {
          validation.enabled = e.target.checked;
          $scope.$digest();
        }
      });

      function reposition() {
        $timeout(() => {
          $scope.$emit('centerOn:reposition');
        });
      }

      /**
       * @ngdoc property
       * @name FieldDialogController#availableWidgets
       * @type {Widgets.Descriptor[]}
       */
      spaceContext.widgets.refresh().then(widgets => {
        const fieldType = fieldFactory.getTypeName($scope.field);

        $scope.availableWidgets = widgets.filter(widget => widget.fieldTypes.includes(fieldType));
      });

      $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
      $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

      dialog.save = () => {
        $scope.$broadcast('validate');
        if (!isValid()) {
          notification.error('Please check the form for validation errors.');
          return;
        }

        fieldDecorator.update($scope.decoratedField, $scope.field, contentTypeData);
        validations.updateField($scope.field, $scope.validations);

        const selectedWidgetId = $scope.widgetSettings.id;
        const selectedWidget = _.find($scope.availableWidgets, { id: selectedWidgetId }) || {};
        let values = $scope.widgetSettings.params;
        let definitions = _.get(selectedWidget, ['parameters']) || [];

        definitions = WidgetParametersUtils.filterDefinitions(definitions, values, selectedWidget);
        values = WidgetParametersUtils.filterValues(definitions, values);

        const missing = WidgetParametersUtils.markMissingValues(definitions, values);
        const hasMissingParameters = Object.keys(missing).some(key => missing[key] === true);

        if (hasMissingParameters) {
          notification.error('Please provide all required parameters.');
          return;
        }

        _.extend($scope.widget, {
          widgetId: selectedWidgetId,
          fieldId: $scope.field.apiName,
          settings: values
        });

        if (selectedWidgetId !== initialWidgetId) {
          trackCustomWidgets.selected($scope.widget, $scope.field, $scope.contentType);
        }

        dialog.confirm();
      };

      function isValid() {
        if (!$scope.fieldForm.$valid) {
          return false;
        }

        if (!_.isEmpty(validations.validateAll($scope.validations))) {
          return false;
        }

        return true;
      }

      function getTitleField() {
        const fieldId = contentTypeData.displayField;
        if (!fieldId || fieldId === $scope.field.id) {
          return null;
        }

        const titleField = _.find(contentTypeData.fields, { id: fieldId });
        return fieldDecorator.getDisplayName(titleField);
      }
    }
  ])

  .controller('FieldDialogSettingsController', [
    '$scope',
    'require',
    ($scope, require) => {
      var fieldDecorator = require('fieldDecorator');
      var buildMessage = require('fieldErrorMessageBuilder');
      var TheLocaleStore = require('TheLocaleStore');
      var joinAndTruncate = require('stringUtils').joinAndTruncate;

      $scope.schema = {
        errors: function(decoratedField) {
          return fieldDecorator.validateInContentType(decoratedField, $scope.contentType.data);
        },
        buildMessage: buildMessage
      };
      $scope.field = $scope.decoratedField;

      $scope.buildTitleCheckboxProps = () => ({
        disabled: $scope.field.disabled,
        id: 'field-dialog--is-title',
        labelText: 'This field represents the Entry title',
        checked: $scope.field.isTitle,
        helpText:
          $scope.currentTitleField && !$scope.field.disabled
            ? `Currently ${
                $scope.currentTitleField
              } is set as the title field. Please enable the field to select it as the Entry title.`
            : undefined,
        light: true,
        onChange: e => {
          $scope.field.isTitle = e.target.checked;
          fieldDecorator.update($scope.decoratedField, $scope.field, $scope.contentType);
          $scope.$digest();
        }
      });

      $scope.buildLocalisationCheckboxProps = () => ({
        id: 'field-dialog--localized',
        labelText: 'Enable localization of this field',
        checked: $scope.field.localized,
        helpText: `All the content can be translated to ${joinAndTruncate(
          $scope.locales,
          2,
          'locales'
        )}`,
        light: true,
        onChange: e => {
          $scope.field.localized = e.target.checked;
          $scope.$digest();
        }
      });

      $scope.$watch('fieldSettingsForm.$invalid', isInvalid => {
        $scope.tab.invalid = isInvalid;
      });

      $scope.locales = _.map(TheLocaleStore.getPrivateLocales(), 'name');
    }
  ])

  /**
   * @ngdoc type
   * @name FieldDialogValidationsController
   *
   * @scope.requires {string}  widgetSettings.id
   * @scope.requires {Widgets.Descriptor[]}  availableWidgets
   */
  .controller('FieldDialogValidationsController', [
    '$scope',
    'require',
    ($scope, require) => {
      const validations = require('validationDecorator');

      $scope.$watch('fieldValidationsForm.$invalid', isInvalid => {
        $scope.tab.invalid = isInvalid;
      });

      $scope.schema = {
        errors: function(decoratedValidation) {
          return validations.validate(decoratedValidation);
        }
      };

      /**
       * @ngdoc property
       * @name FieldDialogValidationsController#showPredefinedValueWidgetHint
       * @type {boolean}
       */
      $scope.$watchGroup(['widgetSettings.id', 'availableWidgets'], values => {
        const name = values[0];
        const available = values[1];
        const properWidgets = ['radio', 'dropdown', 'checkbox'];

        const isProper = _.includes(properWidgets, name);
        const availableIds = _.map(available, 'id');
        const properAvailable = _.intersection(availableIds, properWidgets).length;
        $scope.showPredefinedValueWidgetHint = !isProper && properAvailable;
      });
    }
  ])

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
  .controller('FieldDialogAppearanceController', [
    '$scope',
    'require',
    ($scope, require) => {
      const getDefaultWidgetId = require('widgets/default');

      $scope.defaultWidgetId = getDefaultWidgetId(
        $scope.field,
        $scope.contentType.data.displayField
      );
      $scope.selectWidget = selectWidget;

      $scope.$watch('availableWidgets', available => {
        if (Array.isArray(available)) {
          const selected = _.findIndex(available, { id: $scope.widgetSettings.id });
          selectWidget(selected > -1 ? selected : 0);
        }
      });

      function selectWidget(i) {
        const widget = $scope.availableWidgets[i];
        $scope.selectedWidgetIndex = i;
        $scope.widgetSettings.id = widget.id;
      }
    }
  ])

  .directive('cfFieldAppearanceParameters', [
    'require',
    require => {
      const ReactDOM = require('react-dom');
      const React = require('react');
      const WidgetParametersUtils = require('widgets/WidgetParametersUtils.es6');
      const WidgetParametersForm = require('widgets/WidgetParametersForm.es6').default;

      return {
        restrict: 'E',
        template: '<div class="mount-point"></div>',
        link: function(scope, el) {
          render();
          scope.$watch('widgetSettings.id', render);
          scope.$watch('availableWidgets', render);

          function render() {
            const widget = _.find(scope.availableWidgets, { id: scope.widgetSettings.id });
            if (widget) {
              ReactDOM.render(
                <WidgetParametersForm {...prepareProps(widget)} />,
                el[0].querySelector('.mount-point')
              );
            }
          }

          function prepareProps(widget) {
            let definitions = widget.parameters;
            const settings = scope.widgetSettings;

            settings.params = WidgetParametersUtils.applyDefaultValues(
              definitions,
              settings.params
            );
            definitions = WidgetParametersUtils.filterDefinitions(
              definitions,
              settings.params,
              widget
            );
            definitions = WidgetParametersUtils.unifyEnumOptions(definitions);

            return {
              definitions: definitions,
              values: settings.params,
              missing: WidgetParametersUtils.markMissingValues(definitions, settings.params),
              updateValue: updateValue
            };
          }

          function updateValue(id, value) {
            scope.widgetSettings.params[id] = value;
            scope.$applyAsync();
            render();
          }
        }
      };
    }
  ]);
