import { registerFactory, registerController } from 'NgRegistry';
import { extend, find, cloneDeep, get, isEmpty, map, intersection } from 'lodash';
import { joinAndTruncate } from 'utils/StringUtils';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';
import { toInternalFieldType } from 'widgets/FieldTypes';
import { Notification } from '@contentful/forma-36-react-components';
import getDefaultWidgetId from 'widgets/DefaultWidget';
import * as fieldFactory from 'services/fieldFactory';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import fieldDecorator from 'components/field_dialog/fieldDecorator';
import validationDecorator from 'components/field_dialog/validationDecorator';
import fieldErrorMessageBuilder from 'services/errorMessageBuilder/fieldErrorMessageBuilder';
import TheLocaleStore from 'services/localeStore';
import { create as createBuiltinWidgetList } from 'widgets/BuiltinWidgets';

import fieldDialogTemplate from './field_dialog.html';

// TODO: This dialog should be completely rewritten!

export default function register() {
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
  registerFactory('openFieldDialog', [
    'modalDialog',
    function openFieldDialog(modalDialog) {
      return function openFieldDialog($scope, field, widget) {
        const scope = extend($scope.$new(), {
          field: field,
          widget: widget,
        });
        return modalDialog.open({
          scope: scope,
          template: fieldDialogTemplate,
        }).promise;
      };
    },
  ]);

  /**
   * @ngdoc type
   * @name FieldDialogController
   *
   * @scope.requires {Client.ContentType.Field}  field
   * @scope.requires {Client.ContentType}        contentType
   *
   * @property {string} $scope.widgetSettings.id
   * @property {object} $scope.widgetSettings.params
   */
  registerController('FieldDialogController', [
    '$scope',
    '$timeout',
    function FieldDialogController($scope, $timeout) {
      const dialog = $scope.dialog;

      const contentTypeData = $scope.contentType.data;

      $scope.formIsValid = true;

      $scope.decoratedField = fieldDecorator.decorate($scope.field, contentTypeData);

      $scope.validations = validationDecorator.decorateFieldValidations($scope.field);

      if ($scope.field.type === 'RichText') {
        const validation = find($scope.field.validations, 'nodes');
        const nodeValidations = validation ? validation.nodes : {};
        $scope.nodeValidations = validationDecorator.decorateNodeValidations(nodeValidations);
      }

      $scope.currentTitleField = getTitleField();

      $scope.richTextOptions = getInitialRichTextOptions();
      $scope.onRichTextOptionsChange = (options) => {
        $scope.richTextOptions = options;
      };

      $scope.widgetSettings = {
        id: $scope.widget.widgetId,
        namespace: $scope.widget.widgetNamespace,
        // Need to clone so we do not mutate data if we cancel the dialog
        params: cloneDeep($scope.widget.settings || {}),
      };

      // Reposition the dialog when the active tab changes.
      $scope.$watch(() => $scope.tabController.getActiveTabName(), reposition);
      // Reposition the dialog when the selected widget changes.
      $scope.$watchGroup(['widgetSettings.namespace', 'widgetSettings.id'], reposition);

      $scope.buildRequiredCheckboxProps = () => ({
        id: 'field-validations--required',
        labelText: 'Required field',
        checked: $scope.decoratedField && $scope.decoratedField.required,
        helpText: "You won't be able to publish an entry if this field is empty",
        className: 'validation-checkboxfield',
        onChange: (e) => {
          if ($scope.decoratedField) {
            $scope.decoratedField.required = e.target.checked;
            $scope.$digest();
          }
        },
      });

      $scope.buildValidationCheckboxProps = (validation) => {
        const { name, type, nodeType, onItems, enabled, helpText } = validation;
        const checkboxId = `field-validations${nodeType ? `--${nodeType}` : ''}${`--${type}`}${
          onItems ? '.listElement' : ''
        }`;

        return {
          id: checkboxId,
          labelText: name,
          checked: enabled,
          helpText,
          className: 'validation-checkboxfield',
          name: 'isthisenabled',
          'aria-label': `${enabled ? 'Disable' : 'Enable'} validation`,
          onChange: (e) => {
            validation.enabled = e.target.checked;
            $scope.$digest();
          },
        };
      };

      function reposition() {
        $timeout(() => {
          $scope.$emit('centerOn:reposition');
        });
      }

      const fieldType = toInternalFieldType($scope.field);
      const availableWidgets = [
        ...createBuiltinWidgetList(),
        ...$scope.customWidgets,
      ].filter((widget) => widget.fieldTypes.includes(fieldType));

      $scope.availableWidgets = availableWidgets;
      $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
      $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

      $scope.validate = () => {
        $scope.$broadcast('validate');
      };

      dialog.save = () => {
        $scope.$broadcast('validate');
        if (!isValid()) {
          Notification.error('Please check the form for validation errors.');
          return;
        }

        fieldDecorator.update($scope.decoratedField, $scope.field, contentTypeData);
        validationDecorator.updateField($scope.field, $scope.validations, $scope.nodeValidations);

        if ($scope.field.type === 'RichText') {
          validationDecorator.addEnabledRichTextOptions($scope.field, $scope.richTextOptions);
        }

        const selectedWidget = availableWidgets.find((widget) => {
          const { namespace, id } = $scope.widgetSettings;
          return widget && widget.namespace === namespace && widget.id === id;
        });

        let values = $scope.widgetSettings.params;
        let definitions = get(selectedWidget, ['parameters']) || [];

        values = WidgetParametersUtils.applyDefaultValues(definitions, values);
        definitions = WidgetParametersUtils.filterDefinitions(definitions, values, selectedWidget);
        values = WidgetParametersUtils.filterValues(definitions, values);

        const missing = WidgetParametersUtils.markMissingValues(definitions, values);
        const hasMissingParameters = Object.keys(missing).some((key) => missing[key] === true);

        if (hasMissingParameters) {
          Notification.error('Please provide all required parameters.');
          return;
        }

        extend($scope.widget, {
          widgetId: $scope.widgetSettings.id,
          widgetNamespace: $scope.widgetSettings.namespace,
          fieldId: $scope.field.apiName,
          settings: values,
        });

        dialog.confirm();
      };

      function getInitialRichTextOptions() {
        const validationsForEnabledNodeTypesOrMarks =
          $scope.field.validations &&
          $scope.field.validations.length &&
          $scope.field.validations.filter((value) => {
            return value.enabledNodeTypes || value.enabledMarks;
          });

        return Object.assign({}, ...(validationsForEnabledNodeTypesOrMarks || []));
      }

      function isValid() {
        return (
          $scope.fieldForm.$valid &&
          isEmpty(validationDecorator.validateAll($scope.validations, $scope.nodeValidations))
        );
      }

      function getTitleField() {
        const fieldId = contentTypeData.displayField;
        if (!fieldId || fieldId === $scope.field.id) {
          return null;
        }

        const titleField = find(contentTypeData.fields, { id: fieldId });
        if (titleField) {
          return fieldDecorator.getDisplayName(titleField);
        } else {
          return null;
        }
      }
      const locales = map(TheLocaleStore.getPrivateLocales(), 'name');

      const updateFieldSettings = (updatedSettings) => {
        $scope.decoratedField = updatedSettings;
      };

      const updateValidation = (valid) => {
        $scope.formIsValid = valid;
      };

      $scope.fieldSettingsProps = {
        decoratedField: $scope.decoratedField,
        contentTypeData: contentTypeData,
        locales: locales,
        updateFieldSettings: updateFieldSettings,
        updateValidation: updateValidation,
        fieldTypeLabel: $scope.fieldTypeLabel,
        richTextOptions: $scope.richTextOptions,
        onRichTextOptionsChange: $scope.onRichTextOptionsChange,
      };
    },
  ]);

  registerController('FieldDialogSettingsController', [
    '$scope',
    function FieldDialogSettingsController($scope) {
      $scope.schema = {
        errors: function (decoratedField) {
          return fieldDecorator.validateInContentType(decoratedField, $scope.contentType.data);
        },
        buildMessage: fieldErrorMessageBuilder,
      };
      $scope.field = $scope.decoratedField;

      $scope.buildTitleCheckboxProps = () => ({
        disabled: $scope.field.disabled,
        id: 'field-dialog--is-title',
        labelText: 'This field represents the Entry title',
        checked: $scope.field.isTitle,
        helpText:
          $scope.currentTitleField && !$scope.field.disabled
            ? `Currently ${$scope.currentTitleField} is set as the title field. Please enable the field to select it as the Entry title.`
            : undefined,
        labelIsLight: true,
        onChange: (e) => {
          if ($scope.field) {
            $scope.field.isTitle = e.target.checked;
            fieldDecorator.update($scope.decoratedField, $scope.field, $scope.contentType);
            $scope.$digest();
          }
        },
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
        labelIsLight: true,
        onChange: (e) => {
          $scope.field.localized = e.target.checked;
          $scope.$digest();
        },
      });

      $scope.$watch('fieldSettingsForm.$invalid', (isInvalid) => {
        $scope.tab.invalid = isInvalid;
      });

      $scope.locales = map(TheLocaleStore.getPrivateLocales(), 'name');
    },
  ]);

  /**
   * @ngdoc type
   * @name FieldDialogValidationsController
   *
   * @scope.requires {string}  widgetSettings.id
   * @scope.requires {Widgets.Descriptor[]}  availableWidgets
   */
  registerController('FieldDialogValidationsController', [
    '$scope',
    function FieldDialogValidationsController($scope) {
      $scope.$watch('fieldValidationsForm.$invalid', (isInvalid) => {
        $scope.tab.invalid = isInvalid;
      });

      $scope.schema = {
        errors: function (decoratedValidation) {
          return validationDecorator.validate(decoratedValidation);
        },
      };

      /**
       * @ngdoc property
       * @name FieldDialogValidationsController#showPredefinedValueWidgetHint
       * @type {boolean}
       */
      $scope.$watchGroup(
        ['widgetSettings.namespace', 'widgetSettings.id', 'availableWidgets'],
        ([namespace, id, available]) => {
          const isBuiltin = namespace === NAMESPACE_BUILTIN;
          const predefinedValueWidgetIds = ['radio', 'dropdown', 'checkbox'];
          const validWidgetSelected = isBuiltin && predefinedValueWidgetIds.includes(id);

          const availableWidgetIds = (available || [])
            .filter(({ namespace }) => namespace === NAMESPACE_BUILTIN)
            .map(({ id }) => id);

          const validWidgetAvailable =
            intersection(availableWidgetIds, predefinedValueWidgetIds).length > 0;

          $scope.showPredefinedValueWidgetHint = !validWidgetSelected && validWidgetAvailable;
        }
      );

      if ($scope.field.type === 'RichText') {
        $scope.nodeValidationsEnabled = true;
      }
    },
  ]);

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
  registerController('FieldDialogAppearanceController', [
    '$scope',
    'spaceContext',
    function FieldDialogAppearanceController($scope, spaceContext) {
      const isAdmin = !!spaceContext.getData('spaceMember.admin', false);

      const hasCustomEditor =
        $scope.editorInterface.editor &&
        $scope.editorInterface.editor.widgetNamespace === NAMESPACE_EXTENSION;

      const defaultWidgetId = getDefaultWidgetId(
        $scope.field,
        $scope.contentType.data.displayField
      );

      const defaultWidget = $scope.availableWidgets.find((w) => {
        return w.namespace === NAMESPACE_BUILTIN && w.id === defaultWidgetId;
      });

      function updateProps() {
        $scope.appearanceTabProps = {
          hasCustomEditor,
          availableWidgets: $scope.availableWidgets,
          widgetSettings: $scope.widgetSettings,
          defaultWidget,
          isAdmin,
          onSelect: ({ namespace, id }) => {
            $scope.widgetSettings.namespace = namespace;
            $scope.widgetSettings.id = id;
            updateProps();
            $scope.$applyAsync();
          },
          onParametersUpdate: (params) => {
            $scope.widgetSettings.params = params;
            updateProps();
            $scope.$applyAsync();
          },
        };
      }

      $scope.$watch('availableWidgets', () => {
        updateProps();
        $scope.$applyAsync();
      });
    },
  ]);
}
