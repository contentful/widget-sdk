import _ from 'lodash';

const ALIASES_LIMIT = 101;

// These are the response constructors for the values returned by
// `create` and `update`.
export const EnvironmentAliasUpdated = 'EnvironmentAliasUpdated';
export const IdExistsError = 'IdExistsError';
export const ServerError = 'ServerError';

/**
 * Create a repository to manage space aliases through the CMA.
 *
 * The repo offers the following functions
 * - getAll()
 * - get({id})
 * - create({id, name})
 * - update(environment)
 * - remove(id)
 * - optIn({env_id})
 */

export function create(spaceEndpoint) {
  return { getAll, create, remove, update, get, optIn };

  /**
   * Returns a list of all environment aliases for the given space
   */
  function getAll() {
    return spaceEndpoint({
      method: 'GET',
      path: ['environment_aliases'],
      query: { limit: ALIASES_LIMIT },
    })
      .then((response) => response.items)
      .catch((error) => {
        if (error.code === 'FeatureNotEnabled') {
          return [];
        }
        throw error;
      });
  }

  /**
   * Returns the selected environment alias if it exists for the given space
   */
  function get({ id }) {
    return spaceEndpoint({
      method: 'GET',
      path: ['environment_aliases', id],
    }).catch((error) => {
      if (error.code === 'FeatureNotEnabled') {
        return null;
      }
      throw error;
    });
  }

  /**
   * Create an alias
   */
  function create({ id, aliasedEnvironment }) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['environment_aliases', id],
      data: {
        environment: {
          sys: {
            id: aliasedEnvironment,
            type: 'Link',
            linkType: 'Environment',
          },
        },
      },
    }).then(
      () => {
        return { type: EnvironmentAliasUpdated };
      },
      function mapCreateError(error) {
        if (error.status === 409) {
          return { type: IdExistsError };
        } else {
          return { type: ServerError, error };
        }
      }
    );
  }

  /**
   * Remove the alias
   */
  function remove({ id, version }) {
    return spaceEndpoint(
      {
        method: 'DELETE',
        path: ['environment_aliases', id],
      },
      {
        'X-Contentful-Version': version,
      }
    );
  }

  /**
   * Update the alias target
   */
  function update({ id, version, aliasedEnvironment }) {
    return spaceEndpoint(
      {
        method: 'PUT',
        path: ['environment_aliases', id],
        data: {
          environment: {
            sys: {
              id: aliasedEnvironment,
              type: 'Link',
              linkType: 'Environment',
            },
          },
        },
      },
      {
        'X-Contentful-Version': version,
      }
    );
  }
  /**
   * Opt in to the environment alias feature
   */
  function optIn({ newEnvironmentId }) {
    return spaceEndpoint({
      method: 'PUT',
      path: ['optin', 'environment-aliases'],
      data: {
        newEnvironmentId,
      },
    });
  }
}
