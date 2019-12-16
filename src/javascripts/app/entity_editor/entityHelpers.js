import { getModule } from 'NgRegistry';
import _ from 'lodash';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import * as logger from 'services/logger';
import TheLocaleStore from 'services/localeStore';
import { transformHostname } from 'services/AssetUrlService';

/**
 * TODO This module is basically an adapter for the entity helper methods on
 * `spaceContext` with logic split across the two modules. This makes this
 * module also stateful, i.e. it depends on the set space.
 *
 * We should collect all entity helper logic in one point and create that
 * object where it is needed.
 */
const toInternalLocaleCode = localeCode => TheLocaleStore.toInternalCode(localeCode) || localeCode;

export function newForLocale(localeCode) {
  const internalLocaleCode = toInternalLocaleCode(localeCode);

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
    entityTitle: async function(data) {
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
    entityDescription: async function(data) {
      const entity = await dataToEntity(data);
      return EntityFieldValueSpaceContext.entityDescription(entity, internalLocaleCode);
    },
    /**
     * Returns an object representing the main file associated with the entity.
     * Asset: The asset's file if it has one or `null`.
     * Entry: The image file of an asset of the first asset Link type field or
     *        `null` if the asset has no file or if it's not an image.
     *
     * @param {object} entity
     * @param {string} locale
     * @return {object|null}
     */
    entityFile: entity => entityFile(entity, localeCode),
    entryImage: async function(data) {
      const entity = await dataToEntity(data);
      return EntityFieldValueSpaceContext.entryImage(entity, internalLocaleCode);
    },
    assetFile: asset => assetFile(asset, localeCode),
    assetFileUrl: assetFileUrl
  };
}

/**
 * Accepts entity payload with public field ids and returns an object
 * that mocks the @contentful/client library interface of the entity.
 * In particular it uses private ids.
 */
function dataToEntity(data) {
  const spaceContext = getModule('spaceContext');
  let prepareFields = data.fields;
  const contentTypeId = _.get(data, 'sys.contentType.sys.id');

  if (data.sys.type === 'Entry') {
    const contentType = spaceContext.publishedCTs.get(contentTypeId);

    if (contentType) {
      prepareFields = _.transform(
        contentType.data.fields,
        (acc, ctField) => {
          const field = _.get(data, ['fields', ctField.apiName]);
          if (field) {
            acc[ctField.id] = field;
          }
        },
        {}
      );
    }
  }

  const renamedFields = renameFieldLocales(prepareFields);
  return {
    data: { fields: renamedFields, sys: data.sys },
    getType: _.constant(data.sys.type),
    getContentTypeId: _.constant(contentTypeId)
  };
}

/**
 * Maps field locales from `code` to `internal_code` if locale is available.
 * The locale might be missing in some cases, e.g. it was deleted.
 */
function renameFieldLocales(fields) {
  return _.mapValues(fields, field =>
    _.mapKeys(field, (_, localeCode) => toInternalLocaleCode(localeCode))
  );
}

function entityFile(entity, localeCode) {
  if (entity.sys.type === 'Entry') {
    return newForLocale(localeCode).entryImage(entity);
  } else if (entity.sys.type === 'Asset') {
    return assetFile(entity, localeCode);
  }
  return Promise.resolve(null);
}

async function assetFile(data, localeCode) {
  const internalLocaleCode = toInternalLocaleCode(localeCode);
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
 * Ensures that the entryTitle value will be different from it's original
 * It adds (1) to the end or, if one is already there, increments the integer in the brackets
 * Ignores negative integers in the brackets.
 *
 * Applies to values of each available locale
 *
 * @param {object} fields - entry fields that the user has added
 * @param {string} entryTitleId - the id (displayField) of the entry title field
 * @returns {object}
 */
export function appendDuplicateIndexToEntryTitle(fields, entryTitleId) {
  try {
    const fieldsCopy = _.cloneDeep(fields) || {};
    const localizedEntryTitles = fieldsCopy[entryTitleId];
    if (localizedEntryTitles) {
      for (const [locale, entryTitleValue] of Object.entries(localizedEntryTitles)) {
        if (entryTitleValue) {
          const wrappedNumberRegexp = /\s\(\d\)$/; // finds numbers wrapped into round paranthesis, padded with a space, like (1)
          const trimmedEntryTitleValue = entryTitleValue.trim();
          const match = trimmedEntryTitleValue.match(wrappedNumberRegexp);
          if (match && match.length) {
            const copyId = parseInt(match[0].match(/\d/), 10);
            localizedEntryTitles[locale] = trimmedEntryTitleValue.replace(
              wrappedNumberRegexp,
              ` (${copyId + 1})`
            );
          } else {
            localizedEntryTitles[locale] += ' (1)';
          }
        }
      }
    }
    return fieldsCopy;
  } catch (error) {
    logger.logError(error);
    return fields;
  }
}
