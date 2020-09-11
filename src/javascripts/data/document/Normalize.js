import { forEach, get, isEmpty, isObject, keys, map, transform, keyBy } from 'lodash';

/**
 * Normalize an entry or asset document by removing unused fields.
 *
 * In particular
 * - Remove field value if the locale code does not exist.
 * - Remove field objects if the field is not in the content type
 *   anymore. (Only applies if `contentType` parameter is given.
 * - Make sure that every field object is actually an object.
 * - Remove fields with empty `{}` values - as CMA returns.
 *
 * Note that the first two transformation are performed on the raw
 * document snapshot. This means they are not saved and this might
 * lead to unintended behavior.
 *
 * @param {any} otDoc
 * @param {object} snapshot
 * @param {Client.ContentType?} contentType
 * @param {API.Locale[]} locales
 */
export function normalize(otDoc, snapshot, contentType, locales) {
  const localeMap = makeLocaleMap(locales);
  forceFieldObject(otDoc);
  forceMetadataObject(otDoc);
  removeDeletedFields(snapshot, contentType);
  removeUnknownLocales(snapshot, localeMap);
  removeEmptyFields(snapshot, contentType);
}

/**
 * Return a list of field ids not presented in the given content type.
 * @param {Entry} snapshot
 * @param {ContentType} contentType
 * @return {string[]} content type field id
 */
export function getDeletedFields(snapshot, contentType) {
  const ctFields = get(contentType, ['data', 'fields']);
  if (!ctFields) {
    return [];
  }

  const ctFieldIds = map(ctFields, (field) => field.id);
  return Object.keys(snapshot.fields)
    .map((fieldId) => (ctFieldIds.indexOf(fieldId) === -1 ? fieldId : null))
    .filter(Boolean);
}

function forceFieldObject(otDoc) {
  const fields = otDoc.getValueAt(['fields']);
  if (!isObject(fields)) {
    otDoc.setValueAt(['fields'], {});
  }
}

// TODO: Always ensure presence of `metadata` field once it is 100% in production.
function forceMetadataObject(otDoc) {
  if (
    isObject(otDoc.getValueAt(['metadata'])) &&
    !Array.isArray(otDoc.getValueAt(['metadata', 'tags']))
  ) {
    otDoc.setValueAt(['metadata', 'tags'], []);
  }
}

/**
 * From a list of locale objects, return a map that has the internal
 * locale codes as keys.
 */
function makeLocaleMap(locales) {
  return transform(
    locales,
    (map, locale) => {
      map[locale.internal_code] = true;
    },
    {}
  );
}

function removeUnknownLocales(data, localeMap) {
  forEach(data.fields, (field) => {
    keys(field).forEach((internalCode) => {
      if (!localeMap[internalCode]) {
        delete field[internalCode];
      }
    });
  });
  return data;
}

function removeDeletedFields(snapshot, contentType) {
  getDeletedFields(snapshot, contentType).forEach((fieldId) => {
    delete snapshot.fields[fieldId];
  });
}

function removeEmptyFields(snapshot, contentType) {
  const ctFields = get(contentType, ['data', 'fields']);
  const keyedFields = keyBy(ctFields, 'id');
  const fields = Object.entries(snapshot.fields || {});
  const fieldTypeIsArray = (fieldId) => get(keyedFields, [fieldId, 'type']) === 'Array';
  const isEmptyArray = (value) => Array.isArray(value) && !value.length;

  fields.forEach(([fieldId, fieldValue]) => {
    const localisedValues = Object.entries(fieldValue);
    const canBeRemoved = (value) =>
      value === undefined || (fieldTypeIsArray(fieldId) && isEmptyArray(value));

    localisedValues
      .filter(([, localeValue]) => canBeRemoved(localeValue))
      .forEach(([locale]) => {
        delete snapshot.fields[fieldId][locale];
      });

    if (isEmpty(snapshot.fields[fieldId])) {
      delete snapshot.fields[fieldId];
    }
  });
}
