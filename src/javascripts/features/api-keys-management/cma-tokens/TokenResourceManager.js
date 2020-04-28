import * as Config from 'Config';
import { create as createEndpoint } from 'data/Endpoint';

/**
 * @description
 * Creates an object that acts as a client for the access tokens API.
 *
 * Supported methods are
 * - `create(name)`
 * - `fetch(query)`
 * - `revoke(id)`
 *
 * Uses the request function from `data/Endpoint`. See that
 * documentation for details on the returned promises and the
 * `auth` argument.
 */
export function createToken(auth) {
  const request = createEndpoint(Config.apiUrl('users/me/access_tokens'), auth);

  return { create, fetch, revoke };

  function revoke(id) {
    return request({
      method: 'PUT',
      path: [id, 'revoked'],
    });
  }

  function fetch(query) {
    return request({
      method: 'GET',
      path: [],
      query,
    });
  }

  function create(name) {
    return request({
      method: 'POST',
      path: [],
      data: {
        name,
        scopes: ['content_management_manage'],
      },
    });
  }
}
