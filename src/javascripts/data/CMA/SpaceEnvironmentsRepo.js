import { pick } from 'lodash';
import { get } from 'utils/Collections';

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
   * Returns a list of all environments i.e .real environments and aliased environments
   */
  async function getAll() {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['environments'],
      query: { limit: ENVIRONMENTS_LIMIT },
    });

    // the response from the api gives a combination of real environments and aliased environments
    const hasOptedIntoEnvironmentAliases = items.some(
      ({ sys: { aliasedEnvironment, aliases } }) =>
        aliasedEnvironment !== undefined || aliases !== undefined
    );

    if (!hasOptedIntoEnvironmentAliases) {
      return { environments: items, aliases: [] };
    }

    return items.reduce(
      (envsAndAliases, env) => {
        if (env.sys.aliases !== undefined) {
          return {
            ...envsAndAliases,
            environments: [...envsAndAliases.environments, env],
          };
        }
        return {
          ...envsAndAliases,
          aliases: [...envsAndAliases.aliases, env],
        };
      },
      { aliases: [], environments: [] }
    );
  }

  /**
   * Returns the selected environment if it exists for the given space
   */
  function get({ id }) {
    return spaceEndpoint({
      method: 'GET',
      path: ['environments', id],
    }).then((response) => response, mapUpdateError);
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
        data: { name },
      },
      {
        'X-Contentful-Source-Environment': source || 'master',
      }
    ).then(() => {
      return { type: EnvironmentUpdated };
    }, mapCreateError);
  }

  function remove(id) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['environments', id],
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
      data: pick(env, ['name']),
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
