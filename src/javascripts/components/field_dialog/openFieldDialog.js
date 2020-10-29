import {
  openFieldModalDialog,
  extractFieldValidations,
  extractRichTextNodesValidations,
  getEnabledRichTextOptions,
  groupValidations,
} from 'features/content-model-editor';
import { extend, isEmpty } from 'lodash';

export async function openFieldDialog($scope, field, widget) {
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
      $scope.contentType.data.displayField = field.id;
    }

    const isRichText = field.type === 'RichText';

    let fieldValidations = [...extractFieldValidations(baseValidations)];

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
      field.items.validations = [...extractFieldValidations(itemValidations)];
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
      field.id === updatedField.id ? updatedField : field
    );
    $scope.contentType.data.fields = updatedCTfields;

    // update widget on scope with data from React component
    extend(widget, {
      widgetId: widgetSettings.id,
      widgetNamespace: widgetSettings.namespace,
      settings: widgetSettings.params,
      fieldId: field.apiName,
    });

    $scope.context.dirty = true;
    $scope.$applyAsync();
  };

  return openFieldModalDialog(
    field,
    widget,
    $scope.contentType,
    updateFieldOnScope,
    $scope.editorInterface,
    $scope.customWidgets
  );
}
