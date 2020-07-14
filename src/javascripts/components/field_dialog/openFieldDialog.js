import { getModule } from 'core/NgRegistry';
import fieldDialogTemplate from './field_dialog.html';
// new_field_dialog - temporal folder to contain the refactored component
import openFieldModalDialog from './new_field_dialog/FieldModalDialog';
import { extend, isEmpty } from 'lodash';
import validationDecorator from './validationDecorator';
import {
  extractRichTextNodesValidations,
  getEnabledRichTextOptions,
  groupValidations,
} from 'components/field_dialog/new_field_dialog/utils/helpers';
import { getVariation } from 'LaunchDarkly';
import { NEW_FIELD_DIALOG } from 'featureFlags';

export async function openFieldDialog($scope, field, widget) {
  const modalDialog = getModule('modalDialog');
  const spaceContext = getModule('spaceContext');

  const updateFieldOnScope = (
    {
      isTitle,
      name,
      apiName,
      localized,
      required,
      assetHyperlinkSize,
      embeddedAssetBlockSize,
      embeddedEntryBlockLinkContentType,
      embeddedEntryBlockSize,
      embeddedEntryInlineLinkContentType,
      embeddedEntryInlineSize,
      entryHyperlinkLinkContentType,
      entryHyperlinkSize,
      ...validationFields
    },
    richTextOptions,
    widgetSettings
  ) => {
    const { itemValidations, baseValidations } = groupValidations(validationFields);

    if (isTitle) {
      $scope.contentType.data.displayField = apiName;
    }

    const isRichText = field.type === 'RichText';

    let fieldValidations = [...validationDecorator.extractFieldValidations(baseValidations)];

    // only add RichText node validations to a RichText field
    if (isRichText) {
      const options = getEnabledRichTextOptions(richTextOptions);
      const nodeValidations = extractRichTextNodesValidations({
        assetHyperlinkSize,
        embeddedAssetBlockSize,
        embeddedEntryBlockLinkContentType,
        embeddedEntryBlockSize,
        embeddedEntryInlineLinkContentType,
        embeddedEntryInlineSize,
        entryHyperlinkLinkContentType,
        entryHyperlinkSize,
      });
      fieldValidations = [...fieldValidations, ...options, nodeValidations];
    }

    if (!isEmpty(itemValidations)) {
      field.items.validations = [...validationDecorator.extractFieldValidations(itemValidations)];
    }

    // update field on scope with data from React component
    const updatedField = {
      ...field,
      name,
      apiName,
      localized,
      required,
      validations: fieldValidations,
    };

    const updatedCTfields = $scope.contentType.data.fields.map((field) =>
      field.apiName === updatedField.apiName ? updatedField : field
    );
    $scope.contentType.data.fields = updatedCTfields;
    $scope.$applyAsync();

    // update widget on scope with data from React component
    extend(widget, {
      widgetId: widgetSettings.id,
      widgetNamespace: widgetSettings.namespace,
      settings: widgetSettings.params,
      fieldId: field.apiName,
    });
  };

  const shouldShouwNewDialog = await getVariation(NEW_FIELD_DIALOG, {
    organizationId: spaceContext.organization.sys.id,
  });
  // to avoid major bugs for payed accounts, we are using a feature flag
  if (shouldShouwNewDialog) {
    return openFieldModalDialog(
      field,
      widget,
      spaceContext,
      $scope.contentType,
      updateFieldOnScope,
      $scope.editorInterface,
      $scope.customWidgets
    );
  } else {
    const scope = extend($scope.$new(), {
      field: field,
      widget: widget,
    });
    return modalDialog.open({
      scope: scope,
      template: fieldDialogTemplate,
    }).promise;
  }
}
