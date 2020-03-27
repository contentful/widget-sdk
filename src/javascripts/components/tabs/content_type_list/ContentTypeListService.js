import { getModule } from 'NgRegistry';

export async function fetchContentTypes() {
  const spaceContext = getModule('spaceContext');

  const { items } = await spaceContext.endpoint({
    method: 'GET',
    path: ['content_types'],
    query: { order: 'name', limit: 1000 },
  });

  return items;
}

const normalizeName = (s) => (s || '').trim().toLowerCase().replace(/ +/g, ' ');

function matchesSearchTerm(ct, searchTerm) {
  if (searchTerm !== '') {
    return normalizeName(ct.name).includes(normalizeName(searchTerm));
  } else {
    return true;
  }
}

function isOnSelectedList(ct, status) {
  switch (status) {
    case 'changed':
      return isPublishedAndUpdated(ct);
    case 'active':
      return isPublished(ct);
    case 'draft':
      return !isPublished(ct);
    default:
      return true;
  }
}

export function isPublished(ct) {
  return !!ct.sys.publishedVersion;
}

export function isPublishedAndUpdated(ct) {
  return isPublished(ct) && ct.sys.version > ct.sys.publishedVersion + 1;
}

export function filterContentTypes(contentTypes, { searchTerm, status }) {
  return contentTypes
    .filter((ct) => matchesSearchTerm(ct, searchTerm))
    .filter((ct) => isOnSelectedList(ct, status));
}
