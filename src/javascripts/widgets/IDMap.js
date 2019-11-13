import { invert, transform } from 'lodash';

/**
 * Creates helper functions that allows one to map between public and
 * internal field IDs and locale codes.
 *
 * const map = createIDMap(contentType.fields, TheLocaleStore.getPrivateLocales())
 *
 * map.field.toPublic[aField.id]  // => aField.apiName
 * map.field.toInternal[aField.apiName]  // => aField.id
 *
 * map.locale.toPublic[aLocale.internal_code]  // => aLocale.code
 * map.locale.toInternal[aLocale.code]  // => aLocale.internal_code
 */

export default function createIDMap(fields, privateLocales) {
  return {
    field: createFieldMap(fields),
    locale: createLocaleMap(privateLocales)
  };
}

function createFieldMap(fields) {
  const toPublic = (fields || []).reduce((toPublic, field) => {
    return { ...toPublic, [field.id]: field.apiName };
  }, {});

  return { toPublic, toInternal: invert(toPublic) };
}

function createLocaleMap(privateLocales) {
  const toPublic = (privateLocales || []).reduce((toPublic, locale) => {
    return { ...toPublic, [locale.internal_code]: locale.code };
  }, {});

  const valuesToPublic = localized => {
    return transform(
      localized,
      (transformed, value, internalLocale) => {
        transformed[toPublic[internalLocale]] = value;
      },
      {}
    );
  };

  return {
    toPublic,
    toInternal: invert(toPublic),
    valuesToPublic
  };
}
