import { EntityType } from '@contentful/app-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';

export type Doc = {};

export type EditorData = {};

export type LoadEvents = {};

export type Widget = {
  fieldId: string;
  isVisible: boolean;
  isFocusable: boolean;
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  field: Field;
  settings?: {
    helpText?: string;
  };
};

export type EditorContext = {
  hasInitialFocus: boolean;
  validator: {
    hasFieldLocaleError: (...args: any) => boolean;
    hasFieldError: (...args: any) => boolean;
  };
  entityInfo: {
    type: EntityType;
    contentType?: {
      name: string;
      sys: {
        id: string;
      };
    };
  };
};

export type Field = {
  id: string;
  name: string;
  apiName: string;
  type: string;
  disabled?: boolean;
  required: boolean;
  localized?: boolean;
  items?: {
    type: string;
  };
};

export type Locale = {
  name: string;
  internal_code: string;
  code: string;
  fallbackCode: any;
  default: boolean;
  contentManagementApi: boolean;
  contentDeliveryApi: boolean;
  optional: boolean;
  sys: {
    id: string;
  };
};

export type LocaleData = {
  isSingleLocaleModeOn: boolean;
  focusedLocale: Locale;
  defaultLocale: Locale;
  privateLocales: Array<Locale>;
  isLocaleActive: (locale: Locale) => boolean;
};
