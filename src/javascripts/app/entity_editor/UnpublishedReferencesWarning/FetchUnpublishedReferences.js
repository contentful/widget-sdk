import { getRichTextEntityLinks } from '@contentful/rich-text-links';
import _ from 'lodash';
import { fetchEntities } from './EntityService';

/**
 * Returns a map (field-id: refs) of all unpublished references
 * for a given entry
 */
export default async function fetchUnpublishedReferences({
  entry,
  contentTypes,
  spaceId,
  environmentId
}) {
  const contentType = getContentType(contentTypes, entry);
  const fieldIdLocaleRefMap = getAllRefs(entry, contentType);

  const entryIds = extractRefsOfType(fieldIdLocaleRefMap, 'Entry');
  const assetIds = extractRefsOfType(fieldIdLocaleRefMap, 'Asset');

  const [entries, assets] = await fetchEntities({ spaceId, environmentId, entryIds, assetIds });

  const unpublishedEntries = getUnpublished(entries);
  const unpublishedAssets = getUnpublished(assets);

  const fieldIdLocaleUnbpubRefMap = mapUnpublishedRefs({
    fieldIdLocaleRefMap,
    entries: unpublishedEntries,
    assets: unpublishedAssets,
    contentType
  });

  return fieldIdLocaleUnbpubRefMap;
}

function getUnpublished(entries) {
  return entries.filter(entity => !entity.sys.publishedVersion);
}

function getContentType(contentTypes, entry) {
  return contentTypes.find(ct => ct.sys.id === entry.sys.contentType.sys.id);
}

function extractRefsOfType(fieldIdLocaleRefMap, entityType) {
  return _(fieldIdLocaleRefMap)
    .chain()
    .values()
    .flatMap(fieldLocale => Object.values(fieldLocale))
    .flatMap(localizedRefs => localizedRefs[entityType])
    .value();
}

/**
 * Maps resolved unpublished entries and assets to the reference field map
 *
 * @param {*} { fieldIdLocaleRefMap, entries, assets, contentType }
 * @returns
 */
function mapUnpublishedRefs({ fieldIdLocaleRefMap, entries, assets, contentType }) {
  const res = _(fieldIdLocaleRefMap)
    .chain()
    .toPairs()
    .reduce((acc, [fieldId, localeFieldValues]) => {
      _.forEach(localeFieldValues, ({ Entry, Asset }, localeId) => {
        const fieldUnpublishedEntries = entries.filter(e => Entry.includes(e.sys.id));
        const fieldUnpublishedAssets = assets.filter(a => Asset.includes(a.sys.id));

        const fieldUnpublishedRefs = [...fieldUnpublishedEntries, ...fieldUnpublishedAssets];

        if (fieldUnpublishedRefs.length > 0) {
          acc.push([fieldId, localeId, fieldUnpublishedRefs]);
        }
      });
      return acc;
    }, [])
    .map(([fieldId, fieldLocale, references]) => {
      return {
        field: {
          name: contentType.fields.find(f => f.id === fieldId).name,
          internalLocaleCode: fieldLocale
        },
        references
      };
    })
    .value();
  return res;
}

function getAllRefs(entry, contentType) {
  return contentType.fields.reduce((acc, fieldInfo) => {
    const entryField = entry.fields[fieldInfo.id]; // {en-US, cn:ZH}

    if (fieldInfo.type === 'RichText') {
      acc[fieldInfo.id] = _.mapValues(entryField, fieldValue =>
        getLinkedEntityIdsFromRichText(fieldValue)
      );
      return acc;
    }
    if (fieldInfo.type === 'Link') {
      acc[fieldInfo.id] = _.mapValues(entryField, fieldValue =>
        getLinkedEntityIdsFromLinks(fieldValue)
      );
      return acc;
    }
    if (fieldInfo.type === 'Array' && fieldInfo.items.type === 'Link') {
      acc[fieldInfo.id] = _.mapValues(entryField, fieldValue =>
        getLinkedEntityIdsFromLinks(fieldValue)
      );
      return acc;
    }
    return acc;
  }, {});
}

function getLinkedEntityIdsFromRichText(fieldValue) {
  const referenceMap = getRichTextEntityLinks(fieldValue);
  const entryIds = referenceMap.Entry.map(e => e.id);
  const assetIds = referenceMap.Asset.map(e => e.id);
  return { Entry: entryIds, Asset: assetIds };
}

function getLinkedEntityIdsFromLinks(fieldValue) {
  const links = Array.isArray(fieldValue) ? fieldValue : [fieldValue].filter(Boolean);
  const entryIds = [];
  const assetIds = [];
  links.forEach(link => {
    const { id, linkType } = link.sys;
    if (linkType === 'Entry' && !entryIds.includes(id)) {
      entryIds.push(id);
    } else if (linkType === 'Asset' && !assetIds.includes(id)) {
      assetIds.push(id);
    }
  });
  return { Entry: entryIds, Asset: assetIds };
}
