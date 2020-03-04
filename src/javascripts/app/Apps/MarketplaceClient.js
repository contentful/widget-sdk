import { Notification as Notifier } from '@contentful/forma-36-react-components';
import { get, omit, identity } from 'lodash';
import resolveResponse from 'contentful-resolve-response';
import qs from 'qs';

const MARKETPLACE_SPACE_CDN_TOKEN = 'XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk';
const MARKETPLACE_SPACE_ID = 'lpjm8d10rkpy';
const MARKETPLACE_SPACE_PREVIEW_BASE_URL = `https://preview.contentful.com/spaces/${MARKETPLACE_SPACE_ID}`;
const MARKETPLACE_SPACE_CDN_BASE_URL = `https://cdn.contentful.com/spaces/${MARKETPLACE_SPACE_ID}`;

const { MARKETPLACE_SPACE_TOKEN, MARKETPLACE_SPACE_BASE_URL } = getMarketplaceSpaceUrlAndToken();
const MARKETPLACE_LISTING_QUERY = '/entries?include=0&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1';
const MARKETPLACE_APPS_QUERY = '/entries?include=10&content_type=app';

// Cache globally (across all spaces and environments).
// Changes in marketplace are very infrequent - we can live
// with getting updates only on reload.
let marketplaceAppsCache = null;

export async function fetchMarketplaceApps() {
  // Only retry if the cached value is clearly wrong.
  if (Array.isArray(marketplaceAppsCache) && marketplaceAppsCache.length > 0) {
    return marketplaceAppsCache;
  }

  const [listingResponse, marketplaceAppsResponse] = await Promise.all([
    tryPreviewRequest(MARKETPLACE_LISTING_QUERY),
    tryPreviewRequest(MARKETPLACE_APPS_QUERY)
  ]);
  const allApps = resolveResponse(marketplaceAppsResponse);
  const listedAppIds = new Set(
    get(listingResponse, ['items', '0', 'fields', 'apps'], []).map(app => app.sys.id)
  );

  marketplaceAppsCache = allApps
    .map(a => createAppObject(a, listedAppIds.has(a.sys.id)))
    .filter(({ definitionId }) => !!definitionId);

  return marketplaceAppsCache;
}

async function tryPreviewRequest(query) {
  const isTryingToFetchMarketplacePreview = MARKETPLACE_SPACE_TOKEN !== MARKETPLACE_SPACE_CDN_TOKEN;

  let res = await window.fetch(MARKETPLACE_SPACE_BASE_URL + query, {
    headers: { Authorization: `Bearer ${MARKETPLACE_SPACE_TOKEN}` }
  });

  if (isTryingToFetchMarketplacePreview) {
    if (res.ok) {
      Notifier.success('You are temporarily viewing the apps listing in preview mode.');
    } else {
      // If the user was trying to fetch the marketplace listing
      // from the Preview API with an invalid token, fall back to CDN API.
      res = await window.fetch(MARKETPLACE_SPACE_CDN_BASE_URL + MARKETPLACE_LISTING_QUERY, {
        headers: { Authorization: `Bearer ${MARKETPLACE_SPACE_CDN_TOKEN}` }
      });
    }
  }

  return res.ok ? res.json() : {};
}

function createAppObject(entry, isListed) {
  const definitionId = get(entry, ['fields', 'appDefinitionId']);
  const title = get(entry, ['fields', 'title'], '');

  return {
    definitionId,
    title,
    isListed,
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
    legal: {
      eula: get(entry, ['fields', 'eula'], ''),
      privacyPolicy: get(entry, ['fields', 'privacyPolicy'], '')
    },
    tagLine: get(entry, ['fields', 'tagLine'], ''),
    actionList: get(entry, ['fields', 'uninstallMessages'], []).map(msg => msg.fields)
  };
}

function getMarketplaceSpaceUrlAndToken() {
  const previewToken = parsePreviewToken();
  const isInPreviewMode = !!previewToken;

  return {
    MARKETPLACE_SPACE_TOKEN: isInPreviewMode ? previewToken : MARKETPLACE_SPACE_CDN_TOKEN,
    MARKETPLACE_SPACE_BASE_URL: isInPreviewMode
      ? MARKETPLACE_SPACE_PREVIEW_BASE_URL
      : MARKETPLACE_SPACE_CDN_BASE_URL
  };
}

function parsePreviewToken() {
  const queryString = qs.parse(window.location.search, { ignoreQueryPrefix: true });
  const previewToken = get(queryString, ['preview_token'], '');

  if (previewToken) {
    const restOfQueryString = qs.stringify(omit(queryString, ['preview_token']));
    const targetState = `${window.location.pathname}?${restOfQueryString}`;
    window.history.replaceState({}, document.title, targetState);
  }

  return previewToken;
}
