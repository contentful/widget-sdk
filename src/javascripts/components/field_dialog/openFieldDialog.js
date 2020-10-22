import { getModule } from 'core/NgRegistry';
import {
  openFieldModalDialog,
  extractFieldValidations,
  extractRichTextNodesValidations,
  getEnabledRichTextOptions,
  groupValidations,
} from 'features/content-model-editor';
import { isEmpty } from 'lodash';

export async function openFieldDialog({
  contentTypeModel,
  setContentTypeModel,
  field,
  widget,
  updateWidgetSettings,
  setContextDirty,
  editorInterface,
  extensions,
}) {
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
      setContentTypeModel((state) => {
        return { ...state, data: { ...state.data, displayField: field.id } };
      });
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

    const updatedCTfields = contentTypeModel.data.fields.map((field) =>
      field.id === updatedField.id ? updatedField : field
    );

    setContentTypeModel((ct) => {
      ct.data.fields = updatedCTfields;
      return ct;
    });

    updateWidgetSettings({
      ...widget,
      widgetId: widgetSettings.id,
      widgetNamespace: widgetSettings.namespace,
      settings: widgetSettings.params,
      fieldId: field.apiName,
    });

    setContextDirty(true);
  };

  return openFieldModalDialog(
    field,
    widget,
    spaceContext,
    contentTypeModel,
    updateFieldOnScope,
    editorInterface,
    extensions
  );
}
