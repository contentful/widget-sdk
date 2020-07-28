import { KnownSDK, EditorExtensionSDK, FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { WidgetLocation, Widget, AppParameterValues } from './interfaces';

export const makeConnectMessage = (
  sdk: KnownSDK,
  location: WidgetLocation,
  widget: Widget,
  parameters: Record<string, AppParameterValues>
) => {
  const connectMessage: Record<string, any> = {
    location,
    parameters,
    locales: sdk.locales,
    user: sdk.user,
    initialContentTypes: sdk.space.getCachedContentTypes(),
    ids: {
      ...sdk.ids,
      // Results in `{ app: 'some-app-id' }` or `{ extension: 'some-ext-id' }`.
      [widget.namespace]: widget.id,
    },
  };

  if (
    [
      WidgetLocation.ENTRY_EDITOR,
      WidgetLocation.ENTRY_SIDEBAR,
      WidgetLocation.ENTRY_FIELD,
      WidgetLocation.ENTRY_FIELD_SIDEBAR,
    ].includes(location)
  ) {
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

  if ([WidgetLocation.ENTRY_FIELD, WidgetLocation.ENTRY_FIELD_SIDEBAR].includes(location)) {
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
