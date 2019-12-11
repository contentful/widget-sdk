import qs from 'qs';
import { getStore } from 'browserStorage';
import { sample } from 'lodash';

const injected = readInjectedConfig();
const settings = injected.config;

export function readInjectedConfig() {
  // TODO Should throw when config is not injected, but currently required for tests
  const defaultValue = { config: { environment: 'development' } };
  const el = document.querySelector('meta[name="external-config"]');

  try {
    return JSON.parse(el.getAttribute('content')) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export const MOCK_APIS = {
  gatekeeper: {
    name: 'Gatekeeper',
    url: 'https://pcfjmbizecazdxcwy.stoplight-proxy.io'
  },
  comments: {
    name: 'Comments',
    url: 'http://efbnibwtyzjteg4gr.stoplight-proxy.io'
  },
  tasks: {
    name: 'Tasks',
    url: 'https://xuybd3r75narrebtz.stoplight-proxy.io'
  },
  'disco-lab': {
    name: 'Disco Lab',
    url: 'http://6ryugnmcvdcwsggmd.stoplight-proxy.io'
  }
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
  const mockApiId = getStore().get('use_mock_api');
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
 * URL for ShareJS connection.
 *
 * In production this is `//ot.contentful.com/`.
 */
export const otUrl = sample(settings.otUrl);

/**
 * URL which allows the user to get in touch with us.
 *
 * In production this is `//www.contentful.com/support`.
 */
export const supportUrl = websiteUrl('support');

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
 * Builds a URL for calling micro-backends.
 */
export function microBackendsUrl(path) {
  return settings.microBackendsUrl + ensureLeadingSlash(path);
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
  getstream_io: settings.getstream_io
};

function ensureLeadingSlash(x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}
