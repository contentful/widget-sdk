import { registerFactory, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import { joinAndTruncate } from 'utils/StringUtils.es6';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils.es6';
import { toInternalFieldType } from 'widgets/FieldTypes.es6';
import { Notification } from '@contentful/forma-36-react-components';
import getDefaultWidgetId from 'widgets/DefaultWidget.es6';
import * as fieldFactory from 'services/fieldFactory.es6';

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
    'fieldDecorator',
    'validationDecorator',
    function FieldDialogController($scope, $timeout, fieldDecorator, validations) {
      // TODO: Remove this when there are no more API references to the legacy
      // `StructuredText` field type.
      const RICH_TEXT_FIELD_TYPES = ['RichText', 'StructuredText'];
      const dialog = $scope.dialog;

      const contentTypeData = $scope.contentType.data;

      $scope.decoratedField = fieldDecorator.decorate($scope.field, contentTypeData);

      $scope.validations = validations.decorateFieldValidations($scope.field);

      if (RICH_TEXT_FIELD_TYPES.includes($scope.field.type)) {
        const validation = _.find($scope.field.validations, 'nodes');
        const nodeValidations = validation ? validation.nodes : {};
        $scope.nodeValidations = validations.decorateNodeValidations(nodeValidations);
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
        params: _.cloneDeep($scope.widget.settings || {})
      };

      $scope.$watch(
        () => [$scope.widgetSettings.namespace, $scope.widgetSettings.id].join(','),
        reposition
      );
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
          extraClassNames: 'validation-checkboxfield',
          checkboxProps: {
            name: 'isthisenabled',
            'aria-label': `${enabled ? 'Disable' : 'Enable'} validation`
          },
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

      $scope.availableWidgets = [
        ...$scope.widgets.builtin.map(w => ({ ...w, id: `builtin,${w.id}` })),
        ...$scope.widgets.extension.map(w => ({ ...w, id: `extension,${w.id}` }))
      ].filter(widget => {
        return widget.fieldTypes.includes(fieldType);
      });

      $scope.fieldTypeLabel = fieldFactory.getLabel($scope.field);
      $scope.iconId = fieldFactory.getIconId($scope.field) + '-small';

      dialog.save = () => {
        $scope.$broadcast('validate');
        if (!isValid()) {
          Notification.error('Please check the form for validation errors.');
          return;
        }

        fieldDecorator.update($scope.decoratedField, $scope.field, contentTypeData);
        validations.updateField($scope.field, $scope.validations, $scope.nodeValidations);

        if ($scope.field.type === 'RichText') {
          validations.addEnabledRichTextOptions($scope.field, $scope.richTextOptions);
        }

        const namespaceWidgets = _.get($scope.widgets, [$scope.widgetSettings.namespace], []);
        const selectedWidget = namespaceWidgets.find(w => w.id === $scope.widgetSettings.id);

        let values = $scope.widgetSettings.params;
        let definitions = _.get(selectedWidget, ['parameters']) || [];

        definitions = WidgetParametersUtils.filterDefinitions(definitions, values, selectedWidget);
        values = WidgetParametersUtils.filterValues(definitions, values);

        const missing = WidgetParametersUtils.markMissingValues(definitions, values);
        const hasMissingParameters = Object.keys(missing).some(key => missing[key] === true);

        if (hasMissingParameters) {
          Notification.error('Please provide all required parameters.');
          return;
        }

        _.extend($scope.widget, {
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
          _.isEmpty(validations.validateAll($scope.validations, $scope.nodeValidations))
        );
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
  ]);

  registerController('FieldDialogSettingsController', [
    '$scope',
    'fieldDecorator',
    'TheLocaleStore',
    'fieldErrorMessageBuilder',
    ($scope, fieldDecorator, TheLocaleStore, buildMessage) => {
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
    'validationDecorator',
    ($scope, validations) => {
      // TODO: Remove this when there are no more API references to the legacy
      // `StructuredText` field type.
      const RICH_TEXT_FIELD_TYPES = ['RichText', 'StructuredText'];

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

        const isBuiltin = $scope.widgetSettings.namespace === 'builtin';
        const isProper = isBuiltin && _.includes(properWidgets, name);
        const availableIds = _.map(available, 'id')
          .map(id => id.split(','))
          .filter(([namespace]) => namespace === 'builtin')
          .map(([_, id]) => id);
        const properAvailable = _.intersection(availableIds, properWidgets).length > 0;
        $scope.showPredefinedValueWidgetHint = !isProper && properAvailable;
      });

      if (RICH_TEXT_FIELD_TYPES.includes($scope.field.type)) {
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
      const isAdmin = !!spaceContext.getData('spaceMembership.admin', false);
      const defaultWidgetId = getDefaultWidgetId(
        $scope.field,
        $scope.contentType.data.displayField
      );

      // TODO: this component operates on a flat list of widgets. It should take
      // two separate lists (for builtin and extension widgets) and selection should
      // be done with a pair of (namespace, id).
      // For the time being we take a flat list used in the parent controller and
      // create combined IDs by joining namespace and widget ID with comma which is
      // an invalid char in both namespace and widget ID.
      function updateProps() {
        const availableWidgets = $scope.availableWidgets || [];
        $scope.appearanceTabProps = {
          availableWidgets,
          selectedWidgetId: [$scope.widgetSettings.namespace, $scope.widgetSettings.id].join(','),
          widgetParams: $scope.widgetSettings.params,
          defaultWidgetId: ['builtin', defaultWidgetId].join(','),
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
