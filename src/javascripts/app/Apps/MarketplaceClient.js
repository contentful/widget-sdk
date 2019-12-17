import { get, identity } from 'lodash';
import resolveResponse from 'contentful-resolve-response';

const MARKETPLACE_SPACE_TOKEN = 'XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk';
const MARKETPLACE_SPACE_BASE_URL = `https://cdn.contentful.com/spaces/lpjm8d10rkpy`;
const MARKETPLACE_LISTING_QUERY = '/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1';

// Cache globally (across all spaces and environments).
// Changes in marketplace are very infrequent - we can live
// with getting updates only on reload.
let marketplaceAppsCache = null;

export async function fetchMarketplaceApps() {
  // Only retry if the cached value is clearly wrong.
  if (Array.isArray(marketplaceAppsCache) && marketplaceAppsCache.length > 0) {
    return marketplaceAppsCache;
  }

  const res = await window.fetch(MARKETPLACE_SPACE_BASE_URL + MARKETPLACE_LISTING_QUERY, {
    headers: { Authorization: `Bearer ${MARKETPLACE_SPACE_TOKEN}` }
  });

  const [listingEntry] = resolveResponse(res.ok ? await res.json() : {});

  marketplaceAppsCache = get(listingEntry, ['fields', 'apps'], [])
    .map(createAppObject)
    .filter(({ definitionId }) => {
      return typeof definitionId === 'string' && definitionId.length > 0;
    });

  return marketplaceAppsCache;
}

function createAppObject(entry) {
  const definitionId = get(entry, ['fields', 'appDefinitionId']);
  const title = get(entry, ['fields', 'title'], '');
  const permissionsText = get(entry, ['fields', 'permissions', 'fields', 'text'], '');

  return {
    definitionId,
    title,
    id: get(entry, ['fields', 'slug'], ''),
    author: {
      name: get(entry, ['fields', 'developer', 'fields', 'name']),
      url: get(entry, ['fields', 'developer', 'fields', 'websiteUrl']),
      icon: get(entry, ['fields', 'developer', 'fields', 'icon', 'fields', 'file', 'url'])
    },
    categories: get(entry, ['fields', 'categories'], [])
      .map(category => get(category, ['fields', 'name'], null))
      .filter(identity),
    description: get(entry, ['fields', 'description'], ''),
    icon: get(entry, ['fields', 'icon', 'fields', 'file', 'url'], ''),
    links: get(entry, ['fields', 'links'], []).map(link => link.fields),
    permissions: `__${title} app__ ${permissionsText}`,
    tagLine: get(entry, ['fields', 'tagLine'], ''),
    actionList: get(entry, ['fields', 'uninstallMessages'], []).map(msg => msg.fields)
  };
}
