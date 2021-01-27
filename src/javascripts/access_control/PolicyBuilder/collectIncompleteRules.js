import _ from 'lodash';
import { PolicyBuilderConfig } from './PolicyBuilderConfig';

const PATHS = ['entries.allowed', 'entries.denied', 'assets.allowed', 'assets.denied'];

export const MISSING_ATTRIBUTES = {
  contentType: 'contentType',
  field: 'field',
  entry: 'entry',
  asset: 'asset',
  locale: 'locale',
  tags: 'tags',
};

export function collectIncompleteRules({ internal, contentTypes, entityIds, locales, tagIds }) {
  return collectMissingAttributes(internal);

  function collectMissingAttributes(internal) {
    return _.transform(
      PATHS,
      (acc, path) => {
        const collection = _.get(internal, path, []);
        const rulesWithMissingRefs = checkCollectionForMissingAttributes(collection);
        Object.assign(acc, rulesWithMissingRefs);
      },
      {}
    );
  }

  function checkCollectionForMissingAttributes(collection) {
    return collection.reduce((acc, p) => {
      const missing = [];
      if (isMissingContentType(p)) {
        missing.push(MISSING_ATTRIBUTES.contentType);
      }
      if (!isMetadataPath(p) && isMissingField(p)) {
        missing.push(MISSING_ATTRIBUTES.field);
      }
      if (isMissingEntity(p)) {
        missing.push(MISSING_ATTRIBUTES[p.entity]);
      }
      if (isMissingLocale(p)) {
        missing.push(MISSING_ATTRIBUTES.locale);
      }
      if (isMissingAllTags(p)) {
        missing.push(MISSING_ATTRIBUTES.tags);
      }
      return missing.length ? { ...acc, [p.id]: missing } : acc;
    }, {});
  }

  function isMissingContentType(p) {
    return isSpecific(p.contentType, PolicyBuilderConfig.ALL_CTS) && !hasContentType(p.contentType);
  }

  function isMissingField(p) {
    return (
      !!p.isPath &&
      isSpecific(p.field, PolicyBuilderConfig.ALL_FIELDS) &&
      !hasField(p.contentType, p.field)
    );
  }

  function isMetadataPath(p) {
    return !!p.isPath && p.field === PolicyBuilderConfig.TAGS;
  }

  function isMissingEntity(p) {
    return p.entityId && !entityIds.includes(p.entityId);
  }

  function isMissingLocale(p) {
    return (
      !!p.isPath && isSpecific(p.locale, PolicyBuilderConfig.ALL_LOCALES) && !hasLocale(p.locale)
    );
  }

  function isMissingAllTags(p) {
    // The logic is a bit differet from the others,
    // as rules are valid as long as at least one of their tags still exist.
    // Therefore, here we return false only if all of the rule's tags are missing.
    return p.metadataTagIds?.length && !_.intersection(p.metadataTagIds, tagIds).length;
  }

  function isSpecific(value, allValue) {
    return _.isString(value) && value !== allValue;
  }

  function hasContentType(ctId) {
    return _.isObject(findCt(ctId));
  }

  function hasField(ctId, fieldId) {
    const ct = findCt(ctId);
    const fields = _.get(ct, 'fields', []);
    const field = _.find(fields, { apiName: fieldId }) || _.find(fields, { id: fieldId });
    return _.isObject(field);
  }

  function hasLocale(localeCode) {
    return _.isObject(_.find(locales, { code: localeCode }));
  }

  function findCt(ctId) {
    return _.find(contentTypes, { sys: { id: ctId } });
  }
}
