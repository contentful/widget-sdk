import { FieldAPI, EntryAPI } from 'contentful-ui-extensions-sdk';

export const makeSetValueHandler = (entry: EntryAPI) => {
  return (fieldId: string, localeCode: string, value: any) => {
    return entry.fields[fieldId].getForLocale(localeCode).setValue(value);
  };
};

export const makeRemoveValueHandler = (entry: EntryAPI) => {
  return (fieldId: string, localeCode: string) => {
    return entry.fields[fieldId].getForLocale(localeCode).removeValue();
  };
};

export const makeSetInvalidHandler = (field: FieldAPI) => {
  return function (isInvalid: boolean, localeCode: string) {
    if (field.locale === localeCode) {
      return field.setInvalid(isInvalid);
    }
  };
};
