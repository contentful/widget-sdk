import { pick } from 'lodash';
import { get } from 'utils/Collections';
import { makeCtor } from 'utils/TaggedValues';
import store from 'ReduxStore/store';
import { deleteEnvironmentSuccess } from 'ReduxAppActions/environments/actions';

// Hardcoded limit for v1 orgs is 100 + 1 (master).
// It is less for all v2 space plans.
const ENVIRONMENTS_LIMIT = 101;

// These are the response constructors for the values returned by
// `create` and `update`.
export const EnvironmentUpdated = makeCtor('EnvironmentUpdated');
export const IdExistsError = makeCtor('IdExistsError');
export const NameExistsError = makeCtor('NameExistsError');
export const ServerError = makeCtor('ServerError');

/**
 * Create a repository to manage space environments through the CMA.
 *
 * The repo offers the following functions
 * - getAll()
 * - create({id, name})
 * - update(environment)
 * - remove(id)
 */

export function create(spaceEndpoint) {
  return { getAll, create, remove, update };

  /**
   * Returns a list of all environments for the given space
   */
  function getAll() {
    return spaceEndpoint({
      method: 'GET',
      path: ['environments'],
      query: { limit: ENVIRONMENTS_LIMIT }
    }).then(response => response.items);
  }

  /**
   * Create an environment with the given `id` and name and resolves to
   * a tagged value with the result. The promise never rejects, instead
   * we use the returned tag to indicate an error.
   *
   * Possible tags are `EnvironmentUpdated`, `IdExistsError`,
   * `NameExistsError`, `ServerError`.
   *
   * The `ServerError` result holds the original error as its value.
   */
  function create({ id, name }) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['environments', id],
      data: { name }
    }).then(EnvironmentUpdated, mapCreateError);
  }

  function remove(id) {
    store.dispatch(
      deleteEnvironmentSuccess({
        spaceId: spaceEndpoint.spaceId,
        envId: id
      })
    );
    return spaceEndpoint({
      method: 'DELETE',
      path: ['environments', id]
    });
  }

  /**
   * Create an environment with the given `id` and name and resolves to
   * a tagged value with the result. The promise never rejects, instead
   * we use the returned tag to indicate an error.
   *
   * Possible tags are `EnvironmentUpdated`, `VersionMismatchError`,
   * `NotFoundError`, `IdExistsError`, `NameExistsError`, `ServerError`.
   *
   * The `ServerError` result holds the original error as its value.
   */
  function update(env) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['environments', env.sys.id],
      version: env.sys.version,
      // Gatekeeper only allows you to send `name` attribute
      data: pick(env, ['name'])
    }).then(EnvironmentUpdated, mapUpdateError);
  }
}

function mapCreateError(error) {
  if (error.status === 409) {
    return IdExistsError();
  } else if (isNameExistsError(error)) {
    return NameExistsError();
  } else {
    return ServerError(error);
  }
}

function mapUpdateError(error) {
  if (isNameExistsError(error)) {
    return NameExistsError();
  } else {
    return ServerError(error);
  }
}

function isNameExistsError(error) {
  return error.status === 400 && get(error, ['data', 'message'], '').match(/Name taken/);
}
