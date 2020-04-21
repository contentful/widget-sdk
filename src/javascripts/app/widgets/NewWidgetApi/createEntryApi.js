import { noop, get } from 'lodash';
import * as K from 'core/utils/kefir';
import { createReadOnlyFieldApi, createInternalFieldApi } from './createFieldApi';
/**
 * @typedef { import("contentful-ui-extensions-sdk").EntryAPI } EntryAPI
 */

/**
 * @param {API.ContentType} internal ContentType
 * @param {API.Locale} locale
 * @return {EntryAPI}
 */
export function createReadOnlyEntryApi({ contentType, locale, entry }) {
  const fields = contentType.fields.map((field) => {
    const getValue = () => get(entry, ['fields', field.id, locale.internal_code]);
    return createReadOnlyFieldApi({ field, locale, getValue });
  });

  return {
    getSys: () => {},
    onSysChanged: noop,
    fields: reduceFields(fields),
  };
}

/**
 * @param {API.ContentType} internal ContentType
 * @param {API.Locale} locale
 * @param {Document} otDoc
 * @return {EntryAPI}
 */
export function createEntryApi({ contentType, locale, otDoc }) {
  const fields = contentType.fields.map((field) => {
    return createInternalFieldApi({ field, locale, otDoc });
  });

  return {
    getSys: () => {
      return K.getValue(otDoc.sysProperty);
    },
    onSysChanged: (cb) => {
      return K.onValue(otDoc.sysProperty, cb);
    },
    fields: reduceFields(fields),
  };
}

function reduceFields(fields) {
  return fields.reduce((acc, field) => {
    return {
      ...acc,
      [field.id]: field,
    };
  }, {});
}
