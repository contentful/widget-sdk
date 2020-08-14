import {
  KnownSDK,
  EditorExtensionSDK,
  FieldExtensionSDK,
  LocalesAPI,
  User,
  ContentType,
  IdsAPI,
  EditorInterface,
  EntrySys,
} from 'contentful-ui-extensions-sdk';
import { WidgetLocation, ParameterValues } from './interfaces';
import { isEntryEditingLocation, isFieldEditingLocation } from './utils';

interface FieldBase {
  id: string;
  required: boolean;
  type: string;
  validations?: any[];
  items?: any;
}

interface FieldInfo extends FieldBase {
  localized: boolean;
  locales: string[];
  values: Record<string, any>;
}

interface Field extends FieldBase {
  locale: string;
  value: any;
}

export interface ConnectMessage {
  location: WidgetLocation;
  parameters: Record<string, ParameterValues>;
  locales: LocalesAPI;
  user: User;
  initialContentTypes: ContentType[];
  ids: Partial<IdsAPI>;
  contentType: ContentType;
  editorInterface?: EditorInterface;
  entry: {
    sys: EntrySys;
    metadata?: any;
  };
  fieldInfo: FieldInfo[];
  field?: Field;
}

export const makeConnectMessage = (
  sdk: KnownSDK,
  location: WidgetLocation,
  parameters: Record<string, ParameterValues>
): ConnectMessage => {
  let entryData = {
    contentType: ({ sys: {}, fields: [] } as unknown) as ContentType,
    editorInterface: undefined,
    entry: { sys: {} },
  } as Pick<ConnectMessage, 'contentType' | 'editorInterface' | 'entry'>;

  let fieldData = {
    fieldInfo: [],
    field: undefined,
  } as Pick<ConnectMessage, 'fieldInfo' | 'field'>;

  if (isEntryEditingLocation(location)) {
    const specificSdk = sdk as EditorExtensionSDK;

    entryData = {
      contentType: specificSdk.contentType,
      editorInterface: specificSdk.editor.editorInterface,
      entry: {
        sys: specificSdk.entry.getSys(),
        metadata: specificSdk.entry.metadata,
      },
    };
  }

  if (isFieldEditingLocation(location)) {
    const specificSdk = sdk as FieldExtensionSDK;

    fieldData = {
      fieldInfo: specificSdk.contentType.fields.map((field) => {
        const locales = field.localized
          ? specificSdk.locales.available
          : [specificSdk.locales.default];
        const values = locales.reduce((acc, localeCode) => {
          return { ...acc, [localeCode]: specificSdk.entry.fields[field.id].getValue(localeCode) };
        }, {});

        return {
          localized: field.localized,
          locales,
          values,
          id: field.id,
          required: field.required,
          type: field.type,
          validations: field.validations,
          items: field.items,
        };
      }),
      field: {
        locale: specificSdk.field.locale,
        value: specificSdk.field.getValue(),
        id: specificSdk.field.id,
        type: specificSdk.field.type,
        required: specificSdk.field.required,
        validations: specificSdk.field.validations,
        items: specificSdk.field.items,
      },
    };
  }

  return {
    location,
    parameters,
    locales: sdk.locales,
    user: sdk.user,
    initialContentTypes: sdk.space.getCachedContentTypes(),
    ids: sdk.ids,
    ...entryData,
    ...fieldData,
  };
};
