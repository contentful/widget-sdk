import * as $q from '$q';
import makeRequest from 'data/Request.es6';
import { extend, filter, get } from 'lodash';
import shouldUseEnvEndpoint from './shouldUseEnvEndpoint.es6';

/**
 * @module
 * @description
 * Endpoint for space or organization that makes requests to its resources.
 *
 * Use `.createSpaceEndpoint()` and `.createOrganizationEndpoint()`
 * to create an endpoint, see their description for usage examples.
 *
 * A mock implementation for a space endpoint is provided by
 * 'test/helpers/mocks/SpaceEndpoint'.
 */

/*
 * @ngdoc method
 * @name data/Endpoint.createSpaceEndpoint
 * @description
 * Return a function that makes requests to a space resource.
 * See `.create()` for more information.
 * Request path will be relative to `${baseUrl}/spaces/${spaceId}`.
 *
 * @usage[js]
 * var createSpaceEndpoint = require('data/Endpoint').createSpaceEndpoint;
 * var auth = require('Authorization');
 * var makeEndpointRequest = createSpaceEndpoint('//api.contentful.com', 'SPACE_ID', auth);
 *
 * var entries = makeEndpointRequest({
 *   method: 'GET',
 *   path: ['entries'],
 *   query: {limit: 10}
 * });
 *
 * var asset = makeEndpointRequest({
 *   method: 'PUT',
 *   path: ['assets', 'asset-id'],
 *   version: 12,
 *   data: assetData
 * });
 *
 * @param {string} baseUrl
 * @param {string} spaceId
 * @param {object} auth
 * @param {function(): Promise<string>} auth.getToken
 * @param {function(): Promise<string>} auth.refreshToken
 * @param {string?} envId  if provided will call environment-scoped
 *                         endpoints for applicable entities
 * @returns {function(): Promise<Object>}
 */
export function createSpaceEndpoint(baseUrl, spaceId, auth, envId) {
  const spaceEndpoint = create(withBaseUrl, auth);

  // spaceEndpoint is a function. we assign additional
  // properties so we can detect in which environment we
  // make these requests using only this function
  spaceEndpoint.spaceId = spaceId;
  spaceEndpoint.envId = envId;

  return spaceEndpoint;

  function withBaseUrl(path) {
    return joinPath([baseUrl, 'spaces', spaceId].concat(maybePrefixWithEnv(path)));
  }

  function maybePrefixWithEnv(path) {
    if (envId && shouldUseEnvEndpoint(path)) {
      return ['environments', envId].concat(path);
    } else {
      return path;
    }
  }
}

/*
 * @ngdoc method
 * @name data/Endpoint.createOrganizationEndpoint
 * @description
 * Return a function that makes requests to an organization resource.
 * See `.create()` for more information.
 * Request path will be relative to `${baseUrl}/organizations/${organizationId}`.
 *
 * @usage[js]
 * var Endpoint = require('data/Endpoint');
 * var auth = require('Authorization');
 * var makeEndpointRequest = Endpoint.createOrganizationEndpoint('//api.contentful.com', 'ORG_ID', auth);
 *
 * var users = makeEndpointRequest({
 *   method: 'GET',
 *   path: ['users']
 * });
 *
 * @param {string} baseUrl
 * @param {string} organizationId
 * @param {object} auth
 * @param {function(): Promise<string>} auth.getToken
 * @param {function(): Promise<string>} auth.refreshToken
 * @returns {function(): Promise<Object>}
 */
export function createOrganizationEndpoint(baseUrl, organizationId, auth) {
  const organizationBaseUrl = joinPath([baseUrl, 'organizations', organizationId]);
  return create(organizationBaseUrl, auth);
}

export function createUsersEndpoint(baseUrl, auth) {
  const usersBaseUrl = joinPath([baseUrl, 'users', 'me']);

  return create(usersBaseUrl, auth);
}

/*
 * @private
 * @description
 * Return a function that makes requests to a resource. This is a base function
 * for `.createSpaceEndpoint()` and `.createOrganizationEndpoint()`, these
 * functions should be used instead when making a request to space or
 * organization.
 *
 * The request function accepts a configuration object with the
 * following parameters.
 *
 * - `method` The HTTP method to use
 * - `path` Array of strings that is joined with `/`.
 * - `query` An object that is converted to URL query parameters.
 * - `data` JSON object to send as the payload of the request
 * - `version` If given, its value is send as the
 *   `X-Contentful-Version` header.
 *
 * The request function accepts a map of additional headers as a
 * second argument.
 *
 * The resolved response will contain the payload parsed as a JSON
 * object. If the request fails the promise will be rejected with an
 * error.
 *
 * The error will have the following properties
 *
 * - `status` The HTTP response code
 * - `code` Either the `sys.id` property from the response or the
 *   HTTP status code
 * - `data` The HTTP response body
 * - `request` The original request configuration
 * - `headers` The HTTP response headers
 *
 * @usage[js]
 * var Endpoint = require('data/Endpoint');
 * var auth = require('Authorization');
 * var makeEndpointRequest = Endpoint.create('//api.contentful.com', auth);
 *
 * var users = makeEndpointRequest({
 *   method: 'GET',
 *   path: ['organization', 'ORG_ID', 'users']
 * });
 *
 * @param {string|function} baseUrl  can be a string - will be used as is
 *                                   can be a function of path to full URL
 * @param {object} auth
 * @param {function(): Promise<string>} auth.getToken
 * @param {function(): Promise<string>} auth.refreshToken
 * @returns {function(): Promise<Object>}
 */
export function create(baseUrl, auth) {
  const baseRequest = makeRequest(auth);
  let withBaseUrl = baseUrl;

  if (typeof baseUrl === 'string') {
    withBaseUrl = path => joinPath([baseUrl].concat(path));
  }

  return function request(config, headers) {
    const url = withBaseUrl(config.path);

    const req = {
      method: config.method,
      url,
      headers: makeHeaders(config.version, headers),
      data: config.data,
      params: config.query
    };

    return baseRequest(req).then(
      response => response.data,
      response => {
        const status = parseInt(response.status, 10);
        const error = extend(new Error('API request failed'), {
          status,
          // We duplicate this property because it is required by the
          // request queue.
          statusCode: status,
          code: get(response, ['data', 'sys', 'id'], response.status),
          data: response.data,
          headers: response.headers,
          request: req
        });
        return $q.reject(error);
      }
    );
  };

  function makeHeaders(version, additional) {
    const headers = extend(
      {
        'Content-Type': 'application/vnd.contentful.management.v1+json'
      },
      additional
    );
    if (version) {
      headers['X-Contentful-Version'] = version;
    }
    return headers;
  }
}

function joinPath(components) {
  const startSlashRegex = /^\//;
  const endSlashRegex = /\/$/;
  return filter(components)
    .map((component, ix) => {
      if (ix > 0) {
        component = component.replace(startSlashRegex, '');
      }
      if (ix < components.length - 1) {
        component = component.replace(endSlashRegex, '');
      }
      return component;
    })
    .join('/');
}
