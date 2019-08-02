import _ from 'lodash';

const ALIASES_LIMIT = 101;

/**
 * Create a repository to manage space aliases through the CMA.
 *
 * The repo offers the following functions
 * - getAll()
 */

export function create(spaceEndpoint) {
  return { getAll };

  /**
   * Returns a list of all environments for the given space
   */
  function getAll() {
    return spaceEndpoint(
      {
        method: 'GET',
        path: ['environment_aliases'],
        query: { limit: ALIASES_LIMIT }
      },
      {
        'X-Contentful-Enable-Alpha-Feature': 'environment-aliasing'
      }
    )
      .then(response => response.items)
      .catch(error => {
        if (error.code === 'FeatureNotEnabled') {
          return [];
        }
        throw error;
      });
  }
}
