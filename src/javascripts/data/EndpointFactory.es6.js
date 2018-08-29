import * as Endpoint from 'data/Endpoint';
import * as auth from 'Authentication';
import { apiUrl } from 'Config';

/**
 * Wrapper for data/Endpoint to create space and organization endpoints with
 * only passing prg or space id.
 * It takes authentication object from the singleton service, and api url from
 * the config.
 *
 * TODO: this module imports stateful service Authentication, making it stateful
 * as well. We should refactor it when we agree upon an approach to global
 * application state.
 *
 * See data/Endpoint for documentatiom and usage examples.
 */

/*
 * @description
 * Return a function that makes requests to an organization resource.
 *
 * @param {string} orgId
 * @returns {function(): Promise<Object>}
 */
export function createOrganizationEndpoint(orgId) {
  return Endpoint.createOrganizationEndpoint(apiUrl(), orgId, auth);
}

/*
 * @description
 * Return a function that makes requests to a space resource.
 *
 * @param {string} spaceId
 * @param {string?} envId  if provided will call environment-scoped
 *                         endpoints for applicable entities
 * @returns {function(): Promise<Object>}
 */
export function createSpaceEndpoint(spaceId, envId) {
  return Endpoint.createSpaceEndpoint(apiUrl(), spaceId, auth, envId);
}
