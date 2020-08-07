import { FieldAPI } from 'contentful-ui-extensions-sdk';

export const makeSetValueHandler = (field: FieldAPI) => {
  return function (fieldId: string, localeCode: string, value: any) {
    if (field.id === fieldId && field.locale === localeCode) {
      return field.setValue(value);
    }
  };
};

export const makeRemoveValueHandler = (field: FieldAPI) => {
  return function (fieldId: string, localeCode: string) {
    if (field.id === fieldId && field.locale === localeCode) {
      return field.removeValue();
    }
  };
};

export const makeSetInvalidHandler = (field: FieldAPI) => {
  return function (isInvalid: boolean, localeCode: string) {
    if (field.locale === localeCode) {
      return field.setInvalid(isInvalid);
    }
  };
};
