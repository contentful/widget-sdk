import * as QS from 'qs';
import {settings} from 'environment';

/**
 * @ngdoc service
 * @name Config
 * @description
 * This module exposes all the static data that depends on the
 * environment the app runs in.
 *
 * The environment settings are injected into the code using the
 * `CF_CONFIG` global variable. It is set in the `index.html` file and
 * read by the `environment` service.
 *
 * TODO We should remove the 'environment' service and expose
 * everything here.
 */


/**
 * @ngdoc method
 * @name Config#apiUrl
 * Given a path return the URL for the CMA.
 *
 * In production returns something like `//api.contentful.com/path`.
 * @param {string} path
 * @returns {string}
 */
export function apiUrl (path) {
  return settings.apiUrl + ensureLeadingSlash(path);
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
    base += '?' + QS.stringify(params);
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
 * @name Config#supportUrl
 * URL for logging into Zendesk.
 *
 * In production this is `//be.contentful.com/integrations/zendesk/login`.
 * @param {string} path
 * @returns {string}
 */
export const supportUrl = authUrl('integrations/zendesk/login');

/**
 * @ngdoc property
 * @name Config#env
 * @description
 * Environment - e.g. production, staging, development
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

function ensureLeadingSlash (x = '') {
  if (x.charAt(0) === '/') {
    return x;
  } else {
    return '/' + x;
  }
}
