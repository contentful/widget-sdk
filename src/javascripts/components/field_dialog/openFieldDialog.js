import { getModule } from 'core/NgRegistry';
import {
  openFieldModalDialog,
  extractFieldValidations,
  extractRichTextNodesValidations,
  getEnabledRichTextOptions,
  groupValidations,
} from 'features/content-model-editor';
import { extend, isEmpty, isEqual, clone } from 'lodash';

export async function openFieldDialog($scope, field, widget) {
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
    const clonedField = clone(field);

    if (isTitle && !isEqual($scope.contentType.data.displayField, clonedField.id)) {
      $scope.contentType.data.displayField = clonedField.id;
      $scope.context.dirty = true;
      $scope.$applyAsync();
    }

    const isRichText = clonedField.type === 'RichText';

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
      clonedField.items.validations = [...extractFieldValidations(itemValidations)];
    }

    // update field on scope with data from React component
    const updatedField = {
      ...clonedField,
      name,
      apiName,
      localized,
      required,
      validations: fieldValidations,
    };

    const updatedCTfields = $scope.contentType.data.fields.map((field) =>
      field.id === updatedField.id ? updatedField : field
    );

    if (!isEqual($scope.contentType.data.fields, updatedCTfields)) {
      $scope.contentType.data.fields = updatedCTfields;
      $scope.context.dirty = true;
      $scope.$applyAsync();

      // update widget on scope with data from React component
      extend(widget, {
        widgetId: widgetSettings.id,
        widgetNamespace: widgetSettings.namespace,
        settings: widgetSettings.params,
        fieldId: clonedField.apiName,
      });
    }
  };

  return openFieldModalDialog(
    field,
    widget,
    spaceContext,
    $scope.contentType,
    updateFieldOnScope,
    $scope.editorInterface,
    $scope.customWidgets
  );
}
