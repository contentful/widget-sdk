import _ from 'lodash';
import { ENVIRONMENT_ALIASING, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(ENVIRONMENT_ALIASING);
const ALIASES_LIMIT = 101;

/**
 * Create a repository to manage space aliases through the CMA.
 *
 * The repo offers the following functions
 * - getAll()
 */

export function create(spaceEndpoint) {
  return { getAll, get, update, optIn };

  /**
   * Returns a list of all environment aliases for the given space
   */
  function getAll() {
    return spaceEndpoint(
      {
        method: 'GET',
        path: ['environment_aliases'],
        query: { limit: ALIASES_LIMIT }
      },
      alphaHeader
    )
      .then(response => response.items)
      .catch(error => {
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
    return spaceEndpoint(
      {
        method: 'GET',
        path: ['environment_aliases', id]
      },
      alphaHeader
    ).catch(error => {
      if (error.code === 'FeatureNotEnabled') {
        return null;
      }
      throw error;
    });
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
              linkType: 'Environment'
            }
          }
        }
      },
      {
        ...alphaHeader,
        'X-Contentful-Version': version
      }
    );
  }
  /**
   * Opt in to the environment alias feature
   */
  function optIn({ newEnvironmentId }) {
    return spaceEndpoint(
      {
        method: 'PUT',
        path: ['optin', 'environment-aliases'],
        data: {
          newEnvironmentId
        }
      },
      alphaHeader
    );
  }
}