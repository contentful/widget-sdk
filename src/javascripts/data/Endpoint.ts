import makeRequest from 'data/Request';
import { extend, filter, get } from 'lodash';
import shouldUseEnvEndpoint from './shouldUseEnvEndpoint';
import {
  AppDefinitionEndpoint,
  AuthParamsType,
  BaseEndpoint,
  OrganizationEndpoint,
  RequestConfig,
  RequestHeaders,
  ResponseEntity,
  SpaceEndpoint,
  UserEndpoint,
} from 'data/CMA/types';

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

type BaseUrlFunc = (path: string) => string;

type BaseUrlParam = string | BaseUrlFunc;

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
export function createSpaceEndpoint(
  baseUrl: string,
  spaceId: string,
  auth: AuthParamsType,
  envId?: string | null
): SpaceEndpoint {
  const spaceEndpoint = create<'Space'>(withBaseUrl, auth) as SpaceEndpoint;

  // spaceEndpoint is a function. we assign additional
  // properties so we can detect in which environment we
  // make these requests using only this function
  spaceEndpoint.spaceId = spaceId;
  spaceEndpoint.envId = envId;
  return spaceEndpoint;

  function withBaseUrl(path): string {
    return joinPath([baseUrl, 'spaces', spaceId].concat(maybePrefixWithEnv(path)));
  }

  function maybePrefixWithEnv(path: string[]): string[] {
    if (envId && shouldUseEnvEndpoint(path)) {
      return ['environments', envId, ...path];
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
export function createOrganizationEndpoint(
  baseUrl: string,
  organizationId: string,
  auth: AuthParamsType
): OrganizationEndpoint {
  const organizationBaseUrl = joinPath([baseUrl, 'organizations', organizationId]);
  return create<'Organization'>(organizationBaseUrl, auth);
}

export function createUsersEndpoint(baseUrl: string, auth: AuthParamsType): UserEndpoint {
  const usersBaseUrl = joinPath([baseUrl, 'users', 'me']);
  return create<'User'>(usersBaseUrl, auth);
}

export function createAppDefinitionsEndpoint(
  baseUrl: string,
  auth: AuthParamsType
): AppDefinitionEndpoint {
  const appDefinitionsBaseUrl = joinPath([baseUrl, 'app_definitions']);
  return create<'AppDefinition'>(appDefinitionsBaseUrl, auth);
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
 * @returns {function<T>(): Promise<T>}
 */
export function create<Scope>(baseUrl: BaseUrlParam, auth: AuthParamsType): BaseEndpoint<Scope> {
  const baseRequest = makeRequest(auth);
  let withBaseUrl;
  if (typeof baseUrl === 'string') {
    withBaseUrl = (path: string) => joinPath([baseUrl].concat(path));
  } else {
    withBaseUrl = baseUrl;
  }

  const endpoint: BaseEndpoint<Scope> = async <T extends ResponseEntity>(
    config: RequestConfig,
    headers?: RequestHeaders
  ) => {
    const req = {
      query: config.query,
      method: config.method,
      headers: makeHeaders(config.version, headers),
      body: config.data,
      url: withBaseUrl(config.path),
    };

    // Create the error before `await` so that the stack trace isn't swallowed
    const asyncError = new Error('API request failed');

    try {
      const response = await baseRequest(req);
      return (response.data as unknown) as T;
    } catch (res) {
      const error = extend(asyncError, {
        status: res.status,
        data: res.data,
        statusCode: res.status,
        // `code` is the error id. it falls back to the response status code
        code: get(res.data, ['sys', 'id'], res.status),
        headers: res.headers,
        request: req,
      });

      throw error;
    }
  };

  return endpoint as BaseEndpoint<Scope>;

  function makeHeaders(version?: number, incomingHeaders = {}): RequestHeaders {
    const headers = { ...incomingHeaders };

    if (version) {
      headers['X-Contentful-Version'] = version;
    }

    return headers;
  }
}

function joinPath(components: string[]): string {
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
