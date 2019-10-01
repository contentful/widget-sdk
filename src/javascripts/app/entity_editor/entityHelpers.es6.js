import { getModule } from 'NgRegistry.es6';
import _ from 'lodash';

import TheLocaleStore from 'services/localeStore.es6';
import { transformHostname } from 'services/AssetUrlService.es6';

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
    entityTitle: spaceContextDelegator('entityTitle'),
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
    entityDescription: spaceContextDelegator('entityDescription'),
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
    entryImage: spaceContextDelegator('entryImage'),
    assetFile: asset => assetFile(asset, localeCode),
    assetFileUrl: assetFileUrl
  };

  /**
   * Create a function that delegates to given space context method
   * with the given locale code.
   *
   * The argument of the returned function is external entity data.
   * This data is transformed into an entity for the space context
   * method to work.
   */
  function spaceContextDelegator(methodName) {
    const spaceContext = getModule('spaceContext');
    return async function(data) {
      const entity = await dataToEntity(data);
      return spaceContext[methodName](entity, internalLocaleCode);
    };
  }
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
  const spaceContext = getModule('spaceContext');
  const internalLocaleCode = toInternalLocaleCode(localeCode);
  const entity = await dataToEntity(data);
  return spaceContext.getFieldValue(entity, 'file', internalLocaleCode);
}

function assetFileUrl(file) {
  if (_.isObject(file) && file.url) {
    return Promise.resolve(transformHostname(file.url));
  } else {
    return Promise.reject();
  }
}
