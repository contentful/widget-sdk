import qs from 'libs/qs';
import { getStore } from 'utils/TheStore';
import {settings} from 'environment';

/**
 * @ngdoc service
 * @name Config
 * @description
 * This module exposes all the static settings that depend on
 * the environment the app runs in. They are read from the
 * `environment` constant.
 *
 * TODO We should remove the `environment` constant and expose
 * everything here.
 */


/**
 * @ngdoc method
 * @name Config#apiUrl
 * Given a path return the URL for the CMA.
 *
 * In production returns something like `//api.contentful.com/path`.
 *
 * If a flag to mock all requests is set via url param, returns Stoplight url
 * (this works for quirely only)
 * @param {string} path
 * @returns {string}
 */
export function apiUrl (path) {
  const isUsingMockApi = getStore().get('use_mock_api');
  const baseUrl = isUsingMockApi ? settings.mockApiUrl : settings.apiUrl;
  return baseUrl + ensureLeadingSlash(path);
}

/**
 * @ngdoc method
 * @name Config#authUrl
 * @description
 * Builds a URL for the Gatekeeper host.
 *
 * In production returns something like `//be.contentful.com/path/?query`.
 * @param {string} path
 * @param {object} params  Query parameters
 * @returns {string}
 */
export function authUrl (path, params) {
  let base = settings.authUrl + ensureLeadingSlash(path);
  if (params) {
    base += '?' + qs.stringify(params);
  }
  return base;
}

/**
 * @ngdoc method
 * @name Config#websiteUrl
 * Builds a URL for the marketing website
 *
 * In production returns something like `//www.contentful.com/path`.
 * @param {string} path
 * @returns {string}
 */
export function websiteUrl (path) {
  return settings.marketingUrl + ensureLeadingSlash(path);
}

/**
 * @ngdoc method
 * @name Config#accountUrl
 * Builds a URL for the Gatekeeper account endpoint
 *
 * In production returns something like `//be.contentful.com/account/path`.
 * @param {string} path
 * @returns {string}
 */
export function accountUrl (path) {
  return authUrl('/account' + ensureLeadingSlash(path));
}


/**
 * @ngdoc property
 * @name Config#otUrl
 * URL for ShareJS connection.
 *
 * In production this is `//ot.contentful.com/`.
 * @param {string} path
 * @returns {string}
 */
export const otUrl = settings.otUrl;

/**
 * @ngdoc property
 * @name Config#supportUrl
 * URL which allows the user to get in touch with us.
 *
 * In production this is `//www.contentful.com/support`.
 * @param {string} path
 * @returns {string}
 */
export const supportUrl = websiteUrl('support');

/**
 * @ngdoc property
 * @name Config#env
 * @description
 * Environment - e.g. production, staging, development, local-test
 *
 * @returns {string}
 */
export const env = settings.environment;

/**
 * @ngdoc property
 * @name Config#domain
 * @description
 * Domain name without subdomain, e.g. contentful.com
 *
 * @returns {string}
 */
export const domain = settings.main_domain;

/**
 * @ngdoc property
 * @name Config#snowplow
 * @description
 * Snowplow config object
 *
 * @returns {object}
 */
export const snowplow = settings.snowplow;

/**
 * @ngdoc property
 * @name Config#launchDarkly
 * @description
 * Launch Darkly config object
 *
 * @returns {object}
 */
export const launchDarkly = settings.launchDarkly;


export function toolsUrl (path, params) {
  let base = settings.toolsServiceUrl + ensureLeadingSlash(path.join('/'));
  if (params) {
    base += '?' + qs.stringify(params);
  }
  return base;
}


function ensureLeadingSlash (x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}
