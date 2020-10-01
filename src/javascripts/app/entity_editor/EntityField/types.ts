export type OtDoc = {};

export type Widget = {
  fieldId: string;
  isVisible: boolean;
  field: Field;
  settings?: {
    helpText?: string;
  };
};

export type EditorContext = {
  validator: { hasFieldLocaleError: (...args: any) => boolean };
  entityInfo: {
    type: 'Entry' | 'Asset';
  };
};

export type Field = {
  id: string;
  name: string;
  apiName: string;
  type: string;
  disabled?: boolean;
  required: boolean;
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
