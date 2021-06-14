import { getSpaceContext } from 'classes/spaceContext';
import _ from 'lodash';
import * as EntityFieldValueHelpers from './EntityFieldValueHelpers';
import localeStore from 'services/localeStore';

/**
 * @param {string} contentTypeId
 * @return {Object}
 * Get a content type object by id
 */
export function getContentTypeById(contentTypeId) {
  const spaceContext = getSpaceContext();
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
  return ct && _.find(ct.fields, { id: ct.displayField });
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
  const contentTypeId = entry.getContentTypeId();
  const contentType = getContentTypeById(contentTypeId);
  const defaultInternalLocaleCode = getDefaultInternalLocaleCode();
  return contentType
    ? EntityFieldValueHelpers.getEntryTitle({
        entry: entry.data,
        contentType,
        internalLocaleCode: localeCode,
        defaultInternalLocaleCode,
        defaultTitle,
      })
    : defaultTitle;
}

/**
 * @param {Client.Entity} entity
 * @param {string} [localeCode]
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
  const defaultInternalLocaleCode = getDefaultInternalLocaleCode();
  return EntityFieldValueHelpers.getAssetTitle({
    asset: asset.data,
    defaultTitle,
    internalLocaleCode: localeCode,
    defaultInternalLocaleCode,
  });
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
  const isDisplayField = (field) => field.id === contentType.displayField;
  const isMaybeSlugField = (field) => /\bslug\b/.test(field.name);
  const isDescriptionField = (field) =>
    isTextField(field) && !isDisplayField(field) && !isMaybeSlugField(field);

  const descriptionField = contentType.fields.find(isDescriptionField);
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
 * Returns an internal code of a default locale.
 *
 * @returns {String?}
 */
function getDefaultInternalLocaleCode() {
  const defaultLocale = localeStore.getDefaultLocale();

  return _.get(defaultLocale, 'internal_code');
}
