import { get } from 'lodash';
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

  marketplaceAppsCache = get(listingEntry, ['fields', 'apps'], []);

  return marketplaceAppsCache;
}
