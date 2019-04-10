import { curryRight } from 'lodash';
import { getRichTextEntityLinks } from '@contentful/rich-text-links';
import withPublicationWarning from './withPublicationWarning.es6';

export const withRichTextPublicationWarning = curryRight(withPublicationWarning)({
  getLinkedEntityIds: getLinkedEntityIdsFromRichTextFieldValue
});

export const withLinksPublicationWarning = curryRight(withPublicationWarning)({
  getLinkedEntityIds: getLinkedEntityIdsFromLinksFieldValue
});

function getLinkedEntityIdsFromRichTextFieldValue(fieldValue) {
  const referenceMap = getRichTextEntityLinks(fieldValue);
  const entryIds = referenceMap.Entry.map(e => e.id);
  const assetIds = referenceMap.Asset.map(e => e.id);
  return { entryIds, assetIds };
}

function getLinkedEntityIdsFromLinksFieldValue(fieldValue) {
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
  return { entryIds, assetIds };
}
