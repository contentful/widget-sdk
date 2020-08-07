import { FieldAPI } from 'contentful-ui-extensions-sdk';

function withMatchingField(field: FieldAPI, cb: (value?: any) => any) {
  return function (fieldId: string, localeCode: string, value?: any) {
    if (field.id === fieldId && field.locale === localeCode) {
      return cb(value);
    }
  };
}

export const makeSetValueHandler = (field: FieldAPI) => {
  return withMatchingField(field, (value) => field.setValue(value));
};

export const makeRemoveValueHandler = (field: FieldAPI) => {
  return withMatchingField(field, () => field.removeValue());
};

export const makeSetInvalidHandler = (field: FieldAPI) => {
  return function (isInvalid: boolean, localeCode: string) {
    if (field.locale === localeCode) {
      return field.setInvalid(isInvalid);
    }
  };
};
