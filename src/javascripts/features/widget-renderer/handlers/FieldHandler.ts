import { FieldAPI } from 'contentful-ui-extensions-sdk';

const makeIsCorrectEntryLocalePair = (fieldApi: FieldAPI) => (id: string, locale: string) =>
  id === fieldApi.id && locale === fieldApi.locale;

export const makeSetValueHandler = (fieldApi: FieldAPI) => {
  const isCorrectEntryLocalePair = makeIsCorrectEntryLocalePair(fieldApi);

  return async function (id: string, locale: string, value: any) {
    if (isCorrectEntryLocalePair(id, locale)) {
      return fieldApi.setValue(value);
    }

    throw Object.assign(new TypeError('Unmatched (id, locale) pair'), { data: { id, locale } });
  };
};

export const makeRemoveValueHandler = (fieldApi: FieldAPI) => {
  const isCorrectEntryLocalePair = makeIsCorrectEntryLocalePair(fieldApi);

  return async function (id: string, locale: string) {
    if (isCorrectEntryLocalePair(id, locale)) {
      return fieldApi.removeValue();
    }

    throw Object.assign(new TypeError('Unmatched (id, locale) pair'), { data: { id, locale } });
  };
};

export const makeSetInvalidHandler = (fieldApi: FieldAPI) => {
  return async function (isInvalid: boolean, locale: string) {
    if (locale === fieldApi.locale) {
      return fieldApi.setInvalid(isInvalid);
    }

    throw Object.assign(new TypeError('Unmatched locale'), { data: { locale } });
  };
};
