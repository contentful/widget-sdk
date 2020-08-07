import { KnownSDK, EditorExtensionSDK, FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { WidgetLocation, ParameterValues } from './interfaces';
import { isEntryEditingLocation, isFieldEditingLocation } from './utils';

export const makeConnectMessage = (
  sdk: KnownSDK,
  location: WidgetLocation,
  parameters: Record<string, ParameterValues>
) => {
  const connectMessage: Record<string, any> = {
    location,
    parameters,
    locales: sdk.locales,
    user: sdk.user,
    initialContentTypes: sdk.space.getCachedContentTypes(),
    ids: sdk.ids,
  };

  if (isEntryEditingLocation(location)) {
    const specificSdk = sdk as EditorExtensionSDK;

    connectMessage.contentType = specificSdk.contentType;
    connectMessage.editorInterface = specificSdk.editor.editorInterface;

    connectMessage.entry = {
      sys: specificSdk.entry.getSys(),
      metadata: specificSdk.entry.metadata,
    };
  } else {
    connectMessage.contentType = { sys: {}, fields: [] };
    connectMessage.editorInterface = undefined;
    connectMessage.entry = { sys: {} };
  }

  if (isFieldEditingLocation(location)) {
    const specificSdk = sdk as FieldExtensionSDK;

    connectMessage.fieldInfo = specificSdk.contentType.fields.map((field) => ({
      localized: field.localized,
      locales: field.localized ? specificSdk.locales.available : [specificSdk.locales.default],
      values: specificSdk.entry.fields[field.id].getValue() ?? {},
      id: field.id,
      required: !!field.required,
      type: field.type,
      validations: field.validations,
      items: field.items,
    }));

    connectMessage.field = {
      locale: specificSdk.field.locale,
      value: specificSdk.field.getValue(),
      id: specificSdk.field.id,
      type: specificSdk.field.type,
      required: specificSdk.field.required,
      validations: specificSdk.field.validations,
      items: specificSdk.field.items,
    };
  } else {
    connectMessage.fieldInfo = [];
    connectMessage.field = undefined;
  }

  return connectMessage;
};
