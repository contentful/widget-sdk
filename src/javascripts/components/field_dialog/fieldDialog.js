import { registerFactory, registerController } from 'NgRegistry';
import { extend, find, cloneDeep, get, isEmpty, map, includes, intersection } from 'lodash';
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

// TODO: This dialog should be completely rewritten!

// This dialog operates on a flat list of widgets. It should operate on
// two separate lists (for builtin and extension widgets) and selection should
// be done with a pair of (namespace, id).
// For the time being we create combined IDs by joining namespace and widget
// ID with comma which is an invalid char in both namespace and widget ID.
const makeId = (namespace, id) => [namespace, id].join(',');

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
    modalDialog => {
      return function openFieldDialog($scope, field, widget) {
        const scope = extend($scope.$new(), {
          field: field,
          widget: widget
        });
        return modalDialog.open({
          scope: scope,
          template: 'field_dialog'
        }).promise;
      };
    }
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

      $scope.decoratedField = fieldDecorator.decorate($scope.field, contentTypeData);

      $scope.validations = validationDecorator.decorateFieldValidations($scope.field);

      if ($scope.field.type === 'RichText') {
        const validation = find($scope.field.validations, 'nodes');
        const nodeValidations = validation ? validation.nodes : {};
        $scope.nodeValidations = validationDecorator.decorateNodeValidations(nodeValidations);
      }

      $scope.currentTitleField = getTitleField();

      $scope.richTextOptions = getInitialRichTextOptions();
      $scope.onRichTextOptionsChange = options => {
        $scope.richTextOptions = options;
      };

      $scope.widgetSettings = {
        id: $scope.widget.widgetId,
        namespace: $scope.widget.widgetNamespace,
        // Need to clone so we do not mutate data if we cancel the dialog
        params: cloneDeep($scope.widget.settings || {})
      };

      $scope.$watch(
        () => makeId($scope.widgetSettings.namespace, $scope.widgetSettings.id),
        reposition
      );
      $scope.$watch(() => $scope.tabController.getActiveTabName(), reposition);

      $scope.buildRequiredCheckboxProps = () => ({
        id: 'field-validations--required',
        labelText: 'Required field',
        checked: $scope.decoratedField.required,
        helpText: "You won't be able to publish an entry if this field is empty",
        className: 'validation-checkboxfield',
        onChange: e => {
          $scope.decoratedField.required = e.target.checked;
          $scope.$digest();
        }
      });

      $scope.buildValidationCheckboxProps = validation => {
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
          onChange: e => {
            validation.enabled = e.target.checked;
            $scope.$digest();
          }
        };
      };

      function reposition() {
        $timeout(() => {
          $scope.$emit('centerOn:reposition');
        });
      }

      const fieldType = toInternalFieldType($scope.field);

      $scope.availableWidgets = [NAMESPACE_BUILTIN, NAMESPACE_EXTENSION]
        .reduce((acc, namespace) => {
          const namespaceWidgets = $scope.widgets[namespace].map(widget => {
            return { ...widget, id: makeId(namespace, widget.id) };
          });
          return acc.concat(namespaceWidgets);
        }, [])
        .filter(widget => widget.fieldTypes.includes(fieldType));

      $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
      $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

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

        const namespaceWidgets = get($scope.widgets, [$scope.widgetSettings.namespace], []);
        const selectedWidget = namespaceWidgets.find(w => w.id === $scope.widgetSettings.id);

        let values = $scope.widgetSettings.params;
        let definitions = get(selectedWidget, ['parameters']) || [];

        values = WidgetParametersUtils.applyDefaultValues(definitions, values);
        definitions = WidgetParametersUtils.filterDefinitions(
          definitions,
          values,
          makeId($scope.widgetSettings.namespace, $scope.widgetSettings.id)
        );
        values = WidgetParametersUtils.filterValues(definitions, values);

        const missing = WidgetParametersUtils.markMissingValues(definitions, values);
        const hasMissingParameters = Object.keys(missing).some(key => missing[key] === true);

        if (hasMissingParameters) {
          Notification.error('Please provide all required parameters.');
          return;
        }

        extend($scope.widget, {
          widgetId: $scope.widgetSettings.id,
          widgetNamespace: $scope.widgetSettings.namespace,
          fieldId: $scope.field.apiName,
          settings: values
        });

        dialog.confirm();
      };

      function getInitialRichTextOptions() {
        const validationsForEnabledNodeTypesOrMarks =
          $scope.field.validations &&
          $scope.field.validations.length &&
          $scope.field.validations.filter(value => {
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
    }
  ]);

  registerController('FieldDialogSettingsController', [
    '$scope',
    $scope => {
      $scope.schema = {
        errors: function(decoratedField) {
          return fieldDecorator.validateInContentType(decoratedField, $scope.contentType.data);
        },
        buildMessage: fieldErrorMessageBuilder
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
        labelIsLight: true,
        onChange: e => {
          $scope.field.localized = e.target.checked;
          $scope.$digest();
        }
      });

      $scope.$watch('fieldSettingsForm.$invalid', isInvalid => {
        $scope.tab.invalid = isInvalid;
      });

      $scope.locales = map(TheLocaleStore.getPrivateLocales(), 'name');
    }
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
    $scope => {
      $scope.$watch('fieldValidationsForm.$invalid', isInvalid => {
        $scope.tab.invalid = isInvalid;
      });

      $scope.schema = {
        errors: function(decoratedValidation) {
          return validationDecorator.validate(decoratedValidation);
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

        const isBuiltin = $scope.widgetSettings.namespace === NAMESPACE_BUILTIN;
        const isProper = isBuiltin && includes(properWidgets, name);
        const availableIds = map(available, 'id')
          .map(id => id.split(','))
          .filter(([namespace]) => namespace === NAMESPACE_BUILTIN)
          .map(([_, id]) => id);
        const properAvailable = intersection(availableIds, properWidgets).length > 0;
        $scope.showPredefinedValueWidgetHint = !isProper && properAvailable;
      });

      if ($scope.field.type === 'RichText') {
        $scope.nodeValidationsEnabled = true;
      }
    }
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
    ($scope, spaceContext) => {
      const isAdmin = !!spaceContext.getData('spaceMember.admin', false);

      const hasCustomEditor =
        $scope.editorInterface.editor &&
        $scope.editorInterface.editor.widgetNamespace === NAMESPACE_EXTENSION;

      const defaultWidgetId = getDefaultWidgetId(
        $scope.field,
        $scope.contentType.data.displayField
      );

      function updateProps() {
        $scope.appearanceTabProps = {
          hasCustomEditor,
          availableWidgets: $scope.availableWidgets || [],
          selectedWidgetId: makeId($scope.widgetSettings.namespace, $scope.widgetSettings.id),
          widgetParams: $scope.widgetSettings.params,
          defaultWidgetId: makeId(NAMESPACE_BUILTIN, defaultWidgetId),
          isAdmin,
          onSelect: combinedId => {
            const [namespace, id] = combinedId.split(',');
            $scope.widgetSettings.namespace = namespace;
            $scope.widgetSettings.id = id;
            updateProps();
            $scope.$applyAsync();
          },
          onParametersUpdate: params => {
            $scope.widgetSettings.params = params;
            updateProps();
            $scope.$applyAsync();
          }
        };
      }

      $scope.$watch('availableWidgets', () => {
        updateProps();
        $scope.$applyAsync();
      });
    }
  ]);
}
