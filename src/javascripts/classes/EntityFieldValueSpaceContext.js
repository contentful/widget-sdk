import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import * as EntityFieldValueHelpers from './EntityFieldValueHelpers';
import localeStore from 'services/localeStore';
import * as logger from 'services/logger';

/**
 * @param {string} contentTypeId
 * @return {Object}
 * Get a content type object by id
 */
export function getContentTypeById(contentTypeId) {
  const spaceContext = getModule('spaceContext');
  return spaceContext.publishedCTs.get(contentTypeId);
}

/**
 * @param {string} contentTypeId
 * @return {Object}
 * @description
 * Returns the display field for a given content type id
 */
export function displayFieldForType(contentTypeId) {
  const ct = getContentTypeById(contentTypeId);
  return ct && _.find(ct.data.fields, { id: ct.data.displayField });
}

/**
 * @param {Client.Entry} entry
 * @param {string} localeCode
 * @param {Object} modelValue
 * @return {string|null}
 * @deprecated Use entityTitle() instead.
 * @description
 * Returns the title for a given entry and locale.
 * The `modelValue` flag, if true, causes `null` to be returned
 * when no title is present. If false or left unspecified, the
 * UI string indicating that is returned, which is 'Untitled'.
 */
export function entryTitle(entry, localeCode, modelValue) {
  const defaultTitle = modelValue ? null : 'Untitled';
  let title = defaultTitle;
  try {
    const contentTypeId = entry.getContentTypeId();
    const contentType = getContentTypeById(contentTypeId);
    const defaultInternalLocaleCode = getDefaultInternalLocaleCode();

    title = EntityFieldValueHelpers.getEntryTitle({
      entry: entry.data,
      contentType: contentType.data,
      internalLocaleCode: localeCode,
      defaultInternalLocaleCode,
      defaultTitle,
    });
  } catch (error) {
    // TODO: Don't use try catch. Instead, handle undefined/unexpected values.
    logger.logWarn('Failed to determine entry title', {
      error: error,
      entrySys: _.get(entry, 'data.sys'),
    });
  }

  return title;
}

/**
 * @param {Client.Entity} entity
 * @param {string} localeCode
 * @return {string|null}
 * @description
 * Returns the title for a given entity and locale. Returns null if
 * no title can be found for the entity.
 */
export function entityTitle(entity, localeCode) {
  const type = entity.getType();

  if (type === 'Entry') {
    return entryTitle(entity, localeCode, true);
  } else if (type === 'Asset') {
    return assetTitle(entity, localeCode, true);
  } else {
    return null;
  }
}

/**
 * @param {Client.Asset} asset
 * @param {string} localeCode
 * @param {Object} modelValue
 * @return {Object}
 * @deprecated Use entityTitle() instead.
 * @description
 * Returns the title for a given asset and locale.
 * The `modelValue` flag, if true, causes `null` to be returned
 * when no title is present. If false or left unspecified, the
 * UI string indicating that is returned, which is 'Untitled'.
 */
export function assetTitle(asset, localeCode, modelValue) {
  const defaultTitle = modelValue ? null : 'Untitled';

  let title = defaultTitle;
  try {
    const defaultInternalLocaleCode = getDefaultInternalLocaleCode();

    title = EntityFieldValueHelpers.getAssetTitle({
      asset: asset.data,
      defaultTitle,
      internalLocaleCode: localeCode,
      defaultInternalLocaleCode,
    });
  } catch (error) {
    // TODO: Don't use try catch. Instead, handle undefined/unexpected values.
    logger.logWarn('Failed to determine asset title', {
      error: error,
      assetSys: _.get(asset, 'data.sys'),
    });
  }

  return title;
}

/**
 * @param {string?} localeCode
 * @return {Promise<Object|null>}
 * @description
 * Gets a promise resolving with a localized asset image field representing a
 * given entities file. The promise may resolve with null.
 */
export function entryImage(entry, localeCode) {
  const spaceContext = getModule('spaceContext');

  const link = getValueForMatchedField(entry, localeCode, {
    type: 'Link',
    linkType: 'Asset',
  });

  const assetId = _.get(link, 'sys.id');
  if (link && assetId) {
    return spaceContext.space.getAsset(assetId).then(
      (asset) => {
        const file = getFieldValue(asset, 'file', localeCode);
        const isImage = _.get(file, 'details.image');
        return isImage ? file : null;
      },
      () => null
    );
  } else {
    return Promise.resolve(null);
  }
}

/**
 * @param {Client.Entity} entity
 * @param {string?} localeCode
 * @description
 * Gets the localized value of the first text field that is not the
 * display field and assumably not a slug field. Returns undefined if
 * there is no such field.
 *
 * @return {string?}
 */
export function entityDescription(entity, localeCode) {
  const contentTypeId = entity.getContentTypeId();
  const contentType = getContentTypeById(contentTypeId);
  if (!contentType) {
    return undefined;
  }
  const isTextField = (field) => ['Symbol', 'Text'].includes(field.type);
  const isDisplayField = (field) => field.id === contentType.data.displayField;
  const isMaybeSlugField = (field) => /\bslug\b/.test(field.name);
  const isDescriptionField = (field) =>
    isTextField(field) && !isDisplayField(field) && !isMaybeSlugField(field);

  const descriptionField = contentType.data.fields.find(isDescriptionField);
  return descriptionField ? getFieldValue(entity, descriptionField.id, localeCode) : undefined;
}

/**
 * Given an entity (entry/asset) instance from the client libary,
 * and an internal field ID, returns the field’s value for the
 * given locale.
 *
 * If there is no value set for the given locale, the default
 * locale is used. If the locale code is omitted the default locale
 * is used, too.
 *
 * If there is no value set for the given local _and_ the default
 * locale the first value in the field object is used.
 *
 * @param {Client.Entity} entity
 * @param {string} internalFieldId
 * @param {string?} internalLocaleCode
 * @return {any}
 */
export function getFieldValue(entity, internalFieldId, internalLocaleCode) {
  const defaultInternalLocaleCode = getDefaultInternalLocaleCode();

  return EntityFieldValueHelpers.getFieldValue({
    entity: _.get(entity, 'data'),
    internalFieldId,
    internalLocaleCode,
    defaultInternalLocaleCode,
  });
}

/**
 * @description
 * Return the value of the first field that matches the field
 * definition.
 *
 * The field ID is obtained from the entity’s content type and the
 * field value for the given locale is obtained using
 * `getFieldValue()`.
 *
 * @param {SpaceContext} spaceContext
 * @param {Client.Entity} entity
 * @param {string?} localeCode  Uses default locale if falsy
 * @param {Object|function} fieldMatcher
 *   Field matcher that is passed to '_.find'
 * @returns {any}
 */
function getValueForMatchedField(entity, localeCode, fieldDefinition) {
  const contentTypeId = entity.getContentTypeId();
  const contentType = getContentTypeById(contentTypeId);
  if (!contentType) {
    return;
  }
  const field = _.find(contentType.data.fields, fieldDefinition);
  if (field) {
    return getFieldValue(entity, field.id, localeCode);
  }
}

/**
 * Returns an internal code of a default locale.
 *
 * @returns {String?}
 */
function getDefaultInternalLocaleCode() {
  const defaultLocale = localeStore.getDefaultLocale();

  return _.get(defaultLocale, 'internal_code');
}
