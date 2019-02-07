import qs from 'qs';
import { getStore } from 'TheStore/index.es6';
import { sample } from 'lodash';

const injected = readInjectedConfig();
const settings = injected.config;

function readInjectedConfig() {
  // TODO Should throw when config is not injected, but currently required for tests
  const defaultValue = { config: { environment: 'development' } };
  const el = document.querySelector('meta[name="external-config"]');

  try {
    return JSON.parse(el.getAttribute('content')) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Given a path return the URL for the CMA.
 *
 * In production returns something like `//api.contentful.com/path`.
 *
 * If a flag to mock all requests is set via url param, returns Stoplight url
 * (this works for quirely only)
 */
export const mockApiUrl = settings.mockApiUrl;

export function apiUrl(path) {
  const isUsingMockApi = getStore().get('use_mock_api');
  const baseUrl = isUsingMockApi ? mockApiUrl : settings.apiUrl;
  return baseUrl + ensureLeadingSlash(path);
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
 * Configuration for 3rd party services.
 * TODO: move Snowplow and LD here.
 */
export const services = {
  filestack: settings.filestack,
  contentful: settings.contentful,
  google: settings.google,
  segment_io: settings.segment_io,
  embedly: settings.embedly
};

function ensureLeadingSlash(x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}
