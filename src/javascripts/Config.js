/* global ENV_CONFIG */
import qs from 'qs';
import { getBrowserStorage } from 'core/services/BrowserStorage';

// Config object for the current UI_VERSION injected through webpack.DefinePlugin
// or injected into index.html by tools/lib/index-page.js during build
const injected = (() => {
  const fromDefinePlugin = ENV_CONFIG;

  if (fromDefinePlugin) {
    return fromDefinePlugin;
  }

  // TODO Should throw when config is not injected, but currently required for tests
  const defaultValue = { config: { environment: 'development' } };
  const el = document.querySelector('meta[name="external-config"]');

  try {
    return JSON.parse(el.getAttribute('content')) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
})();

export const settings = injected.config;

export const MOCK_APIS = {
  gatekeeper: {
    name: 'Gatekeeper',
    url: 'https://pcfjmbizecazdxcwy.stoplight-proxy.io',
  },
  comments: {
    name: 'Comments',
    url: 'http://efbnibwtyzjteg4gr.stoplight-proxy.io',
  },
  tasks: {
    name: 'Tasks',
    url: 'https://xuybd3r75narrebtz.stoplight-proxy.io',
  },
  'disco-lab': {
    name: 'Disco Lab',
    url: 'http://6ryugnmcvdcwsggmd.stoplight-proxy.io',
  },
};

/**
 * Given a path return the URL for the CMA.
 *
 * In production returns something like `//api.contentful.com/path`.
 *
 * If one of above MOCK_APIS keys is set via `use_mock_api=` url param,
 * then this returns a Stoplight url.
 */
export function apiUrl(path) {
  const mockApiId = getBrowserStorage().get('use_mock_api');
  const mockApiInfo = MOCK_APIS[mockApiId];
  const baseUrl = mockApiInfo ? mockApiInfo.url : settings.apiUrl;
  return baseUrl + ensureLeadingSlash(path);
}

/**
 * Given a path return the URL for the Upload API.
 */
export function uploadApiUrl(path) {
  return settings.uploadApiUrl + ensureLeadingSlash(path);
}

/**
 * Builds a URL for the Gatekeeper host.
 *
 * In production returns something like `//be.contentful.com/path/?query`.
 */
export function authUrl(path, params) {
  let base = settings.authUrl + ensureLeadingSlash(path);
  if (params) {
    base += '?' + qs.stringify(params);
  }
  return base;
}

/**
 * Builds a URL for the marketing website
 *
 * In production returns something like `//www.contentful.com/path`.
 */
export function websiteUrl(path) {
  return settings.marketingUrl + ensureLeadingSlash(path);
}

/**
 * Builds a URL for the Gatekeeper account endpoint
 *
 * In production returns something like `//be.contentful.com/account/path`.
 */
export function accountUrl(path) {
  return authUrl('/account' + ensureLeadingSlash(path));
}

/**
 * URL which allows the user to get in touch with us.
 *
 * In production this is `//www.contentful.com/support`.
 */
export const supportUrl = websiteUrl('support');

/**
 * URL which allows the user to get in touch with sales team.
 *
 * In production this is `//www.contentful.com/contact/sales`.
 */
export const salesUrl = websiteUrl('contact/sales');

/**
 * URL which navigates the user to learn about apps
 *
 * In production this is `//www.contentful.com/contentful-apps`.
 */
export const appsMarketingUrl = websiteUrl('contentful-apps');

/**
 * URL which allows the user to get to the Help Center in the website.
 *
 * In production this is `//www.contentful.com/help`.
 */
export const helpCenterUrl = websiteUrl('help');

/**
 * URL which allows the user to get to the Documentation for developers in the website.
 *
 * In production this is `//www.contentful.com/developers/docs`.
 */
export const developerDocsUrl = websiteUrl('developers/docs');

/**
 * URL which allows the user to get to the Changelog in the website.
 *
 * In production this is `//www.contentful.com/developers/changelog`.
 */
export const developersChangelogUrl = websiteUrl('developers/changelog');

/**
 * Environment - e.g. production, staging, development, unittest
 */
export const env = settings.environment;

/**
 * Git sha or `null` in development.
 */
export const gitRevision = injected.uiVersion;

/**
 * Main domain name without subdomain, e.g. contentful.com
 */
export const domain = settings.main_domain;

// HTTPS URL of the Web App.
export const appUrl = `https://app.${domain}`;

/**
 * Secure assets host url
 */
export const secureAssetsUrl = settings.secureAssetsUrl;

/**
 * Snowplow config object
 */
export const snowplow = settings.snowplow;

/**
 * Pusher service settings
 */
export const pusher = settings.pusher;

/**
 * Launch Darkly config object
 */
export const launchDarkly = settings.launchDarkly;

/**
 * Marketplace environment
 * Used to resolve which AppDefinition IDs should be used in the app listing
 * The actual mapping is fetched over a contentful space
 */
export const marketplaceEnvironment = settings.marketplaceEnvironment;

/**
 * Contentful Launch
 */
export const launchAppUrl = `https://launch.${domain}`;

/**
 * Builds tools API URL. This is the service for creating
 * zip files with project boilerplates.
 */
export function toolsUrl(path, params) {
  let base = settings.toolsServiceUrl + ensureLeadingSlash(path.join('/'));
  if (params) {
    base += '?' + qs.stringify(params);
  }
  return base;
}

/**
 * Builds a URL for calling telemetry.
 */
export function telemetryUrl(path) {
  return settings.telemetryUrl + ensureLeadingSlash(path);
}

/*
  Creates an internal GK oauth URL, optionally with the origin/referrer (so that GK knows
  where to return the user after completing the oauth flow).

  Will, by default, return a URL in this shape:

  https://be.contentful.com/account/profile/auth/github

  With the origin, it will look like this:

  https://be.contentful.com/account/profile/auth/github?origin=https://app.contentful.com/account/user/profile
 */
export function oauthUrl(identityKey, originSuffix) {
  let base = `https://be.${domain}/account/profile/auth/${identityKey}`;

  if (originSuffix) {
    base += '?' + qs.stringify({ origin: `https://app.${domain}${originSuffix}` });
  }

  return base;
}

/**
 * Configuration for 3rd party services.
 * TODO: move Snowplow and LD here.
 */
export const services = {
  filestack: settings.filestack,
  contentful: settings.contentful,
  google: settings.google,
  segment_io: settings.segment_io,
  embedly: settings.embedly,
  getstream_io: settings.getstream_io,
  osano: settings.osano,
  sentry: settings.sentry,
};

function ensureLeadingSlash(x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}
