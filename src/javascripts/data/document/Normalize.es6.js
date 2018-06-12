import { get, isObject, transform, map, forEach, keys } from 'lodash';

/**
 * Normalize an entry or asset document by removing unused fields.
 *
 * In particular
 * - Remove field value if the locale code does not exist.
 * - Remove field objects if the field is not in the content type
 *   anymore. (Only applies if `contentType` parameter is given.
 * - Make sure that every field object is actually an object.
 *
 * Note that the first two transformation are performed on the raw
 * document snapshot. This means they are not saved and this might
 * lead to unintended behavior.
 *
 * @param {Document} otDoc
 * @param {object} snapshot
 * @param {Client.ContentType?} contentType
 * @param {API.Locale[]} locales
 */
export function normalize (otDoc, snapshot, contentType, locales) {
  const ctFields = get(contentType, ['data', 'fields']);
  const localeMap = makeLocaleMap(locales);
  forceFieldObject(otDoc);
  removeDeletedFields(snapshot, ctFields);
  removeUnknownLocales(snapshot, localeMap);
}


function forceFieldObject (otDoc) {
  const fields = otDoc.getValueAt(['fields']);
  if (!isObject(fields)) {
    otDoc.setValueAt(['fields'], {});
  }
}


/**
 * From a list of locale objects, return a map that has the internal
 * locale codes as keys.
 */
function makeLocaleMap (locales) {
  return transform(locales, (map, locale) => {
    map[locale.internal_code] = true;
  }, {});
}


function removeUnknownLocales (data, localeMap) {
  forEach(data.fields, field => {
    keys(field).forEach(internalCode => {
      if (!localeMap[internalCode]) {
        delete field[internalCode];
      }
    });
  });
  return data;
}


function removeDeletedFields (snapshot, ctFields) {
  if (!ctFields) {
    return;
  }

  const ctFieldIds = map(ctFields, field => field.id);

  forEach(snapshot.fields, (_fieldValue, fieldId) => {
    if (ctFieldIds.indexOf(fieldId) < 0) {
      delete snapshot.fields[fieldId];
    }
  });
}
