import _ from 'lodash';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import * as logger from 'services/logger';
import TheLocaleStore from 'services/localeStore';
import { transformHostname } from 'services/AssetUrlService';
import { makeSlug, slugify } from '@contentful/field-editor-slug';
import { getSpaceContext } from 'classes/spaceContext';

const toAlternativeLocaleCode = (localeCode, toPrivate = true) => {
  const toAlternativeCode = toPrivate ? TheLocaleStore.toInternalCode : TheLocaleStore.toPublicCode;
  return toAlternativeCode(localeCode) || localeCode;
};

/**
 * TODO This module is basically an adapter for the entity helper methods on
 * `spaceContext` with logic split across the two modules. This makes this
 * module also stateful, i.e. it depends on the set space.
 *
 * We should collect all entity helper logic in one point and create that
 * object where it is needed.
 */
export function newForLocale(localeCode) {
  const internalLocaleCode = toAlternativeLocaleCode(localeCode, true);

  return {
    /**
     * Returns a string representing the entity's title in a given locale.
     * Asset: Title field.
     * Entry: Value of the field serving as title according to the entry's
     *        content type.
     *
     * @param {object} entity
     * @param {string} locale
     * @return {string|null}
     */
    entityTitle: async function (data) {
      const entity = await dataToEntity(data);
      return EntityFieldValueSpaceContext.entityTitle(entity, internalLocaleCode);
    },
    /**
     * Returns a string representing the entity's description.
     * Asset: Description field.
     * Entry: Value of the first Symbol or Text type field that
     *        is not the title field.
     *
     * TODO: Consider `RichText` type fields as description.
     *
     * @param {object} entity
     * @param {string} locale
     * @return {string}
     */
    entityDescription: async function (data) {
      const entity = await dataToEntity(data);
      return EntityFieldValueSpaceContext.entityDescription(entity, internalLocaleCode);
    },
    assetFile: (asset) => assetFile(asset, localeCode),
    assetFileUrl: assetFileUrl,
  };
}

/**
 * Accepts entity payload with public field ids and returns an object
 * that mocks the @contentful/client library interface of the entity.
 * In particular it uses private ids.
 */
function dataToEntity(data) {
  return {
    data: toPrivateEntity(data),
    getType: _.constant(data.sys.type),
    getContentTypeId: _.constant(_.get(data, 'sys.contentType.sys.id')),
  };
}

/*
  Converts an entity fields to their corresponding ones of the 
  private content type
 */
export function toPrivateEntity(entity) {
  return convertEntity(entity, true);
}

/*
  Converts an entity fields to their corresponding ones of the 
  public content type
 */
export function toPublicEntity(entity) {
  return convertEntity(entity, false);
}

/*
  Converts an entity fields to their corresponding ones of the 
  private or public content type, depending on the give `toPrivate`
 */
function convertEntity(entity, toPrivate = true) {
  const spaceContext = getSpaceContext();
  let preparedFields = entity.fields;
  const contentTypeId = _.get(entity, 'sys.contentType.sys.id');

  if (entity.sys.type === 'Entry') {
    const contentType = spaceContext.publishedCTs.get(contentTypeId);

    if (contentType) {
      preparedFields = _.transform(
        contentType.data.fields,
        (acc, ctField) => {
          const [from, to] = toPrivate
            ? [ctField.apiName, ctField.id]
            : [ctField.id, ctField.apiName];
          const field = _.get(entity, ['fields', from]);
          if (field) {
            acc[to] = field;
          }
        },
        {}
      );
    }
  }

  const renamedFields = renameFieldLocales(preparedFields, toPrivate);

  return {
    fields: renamedFields,
    sys: entity.sys,
  };
}

/**
 * Maps field locales from `code` to `internal_code` if locale is available.
 * The locale might be missing in some cases, e.g. it was deleted.
 */
function renameFieldLocales(fields, toPrivate) {
  return _.mapValues(fields, (field) =>
    _.mapKeys(field, (_, localeCode) => toAlternativeLocaleCode(localeCode, toPrivate))
  );
}

async function assetFile(data, localeCode) {
  const internalLocaleCode = toAlternativeLocaleCode(localeCode);
  const entity = await dataToEntity(data);
  return EntityFieldValueSpaceContext.getFieldValue(entity, 'file', internalLocaleCode);
}

function assetFileUrl(file) {
  if (_.isObject(file) && file.url) {
    return Promise.resolve(transformHostname(file.url));
  } else {
    return Promise.reject();
  }
}

/**
 * Ensures that the entryTitle value will be different from it's original.
 * It adds (1) to the end or, if one is already there, increments the integer in the brackets
 * Ignores negative integers or zero in the brackets.
 *
 * Applies to values of each available locale.
 *
 * @param {object} fields - entry fields that the user has added
 * @param {string} entryTitleId - the id (displayField) of the entry title field
 * @returns {object}
 */
export function appendDuplicateIndexToEntryTitle(fields, entryTitleId) {
  // Finds positive numbers wrapped into round parenthesis preceded by a space at the end of
  // a string like "foo (1)". References the actual number as $1.
  const WRAPPED_NUMBER_REGEXP = /\s+\(([1-9]\d*)\)\s*$/;

  try {
    const fieldsCopy = _.cloneDeep(fields) || {};
    const localizedEntryTitles = fieldsCopy[entryTitleId];
    if (localizedEntryTitles) {
      for (const [locale, title] of Object.entries(localizedEntryTitles)) {
        if (title && title.trim()) {
          const match = title.match(WRAPPED_NUMBER_REGEXP);
          const index = match && Number(match[1]);
          const newTitle = index
            ? title.replace(WRAPPED_NUMBER_REGEXP, ` (${index + 1})`)
            : `${title.trimEnd()} (1)`;
          // TODO: If the title field is a `Symbol`, be cautious to not exceed 256 chars.
          localizedEntryTitles[locale] = newTitle;
        }
      }
    }
    return fieldsCopy;
  } catch (error) {
    // TODO: Remove try/catch once we've gained some confidence.
    logger.captureError(error);
    return fields;
  }
}

const getLocalizedEntryData = (data, locale, isLocalized) => {
  let entryDataValue = null;
  if (data) {
    entryDataValue = isLocalized ? data[locale] : Object.values(data)[0];
  }
  return entryDataValue;
};

export function alignSlugWithEntryTitle({
  entryTitleData,
  unindexedTitleData,
  isEntryTitleLocalized,
  slugFieldData,
  isRequired,
  createdAt,
}) {
  if (!slugFieldData) {
    return slugFieldData;
  }

  const result = {};

  // we do this for each locale
  for (const locale of Object.keys(slugFieldData)) {
    const displayFieldValue = getLocalizedEntryData(entryTitleData, locale, isEntryTitleLocalized);

    const unindexedDisplayFieldValue = getLocalizedEntryData(
      unindexedTitleData,
      locale,
      isEntryTitleLocalized
    );
    const localeCode = TheLocaleStore.toInternalCode(locale);

    const originalSlugValue = slugify(unindexedDisplayFieldValue, localeCode);
    const indexedSlug = slugify(displayFieldValue, localeCode);
    // in this case slug will become untitled slug
    const slugWasAndIsFalsy = !originalSlugValue && !slugFieldData[locale];
    const slugIsNotAlreadyAligned = indexedSlug !== slugFieldData[locale];
    // first condition will result in untitled slug, second one will align slug with title, if title is defined
    const slugShouldAlign =
      (slugWasAndIsFalsy && isRequired) || (!!displayFieldValue && slugIsNotAlreadyAligned);

    if (slugShouldAlign) {
      result[locale] = makeSlug(displayFieldValue, {
        locale: localeCode,
        isOptionalLocaleWithFallback: !isRequired,
        createdAt: createdAt || new Date(),
      });
    } else {
      result[locale] = slugFieldData[locale];
    }
  }
  return result;
}
