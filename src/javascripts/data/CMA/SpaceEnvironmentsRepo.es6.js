import { pick } from 'lodash';
import { get } from 'utils/Collections.es6';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo.es6';

// Hardcoded limit for v1 orgs is 100 + 1 (master).
// It is less for all v2 space plans.
export const ENVIRONMENTS_LIMIT = 101;

// These are the response constructors for the values returned by
// `create` and `update`.
export const EnvironmentUpdated = 'EnvironmentUpdated';
export const IdExistsError = 'IdExistsError';
export const NameExistsError = 'NameExistsError';
export const ServerError = 'ServerError';

/**
 * Create a repository to manage space environments through the CMA.
 *
 * The repo offers the following functions
 * - getAll()
 * - get({id})
 * - create({id, name})
 * - update(environment)
 * - remove(id)
 */

export function create(spaceEndpoint) {
  return { getAll, create, remove, update, get };

  /**
   * Returns a list of all environments and environment aliases for the given space
   */
  async function getAll() {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['environments'],
      query: { limit: ENVIRONMENTS_LIMIT }
    });

    // the response from the api gives a combination of real environments and aliased environments
    const aliases = await SpaceAliasesRepo.create(spaceEndpoint).getAll();
    const hasNotOptedIntoEnvironmentAliases = !aliases || aliases.length === 0;
    if (hasNotOptedIntoEnvironmentAliases) return { environments: items };

    // if the space is opted in we filter the real environments
    const environments = items.filter(env => env.sys.aliases !== undefined);
    return { environments, aliases };
  }

  /**
   * Returns the selected environment if it exists for the given space
   */
  function get({ id }) {
    return spaceEndpoint({
      method: 'GET',
      path: ['environments', id]
    }).then(response => response, mapUpdateError);
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
  function create({ id, name, source }) {
    return spaceEndpoint(
      {
        method: 'PUT',
        path: ['environments', id],
        data: { name }
      },
      {
        'X-Contentful-Source-Environment': source || 'master'
      }
    ).then(() => {
      return { type: EnvironmentUpdated };
    }, mapCreateError);
  }

  function remove(id) {
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
    }).then(() => {
      return { type: EnvironmentUpdated };
    }, mapUpdateError);
  }
}

function mapCreateError(error) {
  if (error.status === 409) {
    return { type: IdExistsError };
  } else if (isNameExistsError(error)) {
    return { type: NameExistsError };
  } else {
    return { type: ServerError, error };
  }
}

function mapUpdateError(error) {
  if (isNameExistsError(error)) {
    return { type: NameExistsError };
  } else {
    return { type: ServerError };
  }
}

function isNameExistsError(error) {
  return error.status === 400 && get(error, ['data', 'message'], '').match(/Name taken/);
}
