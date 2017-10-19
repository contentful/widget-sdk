import makeFetch from 'data/Request';
import {apiUrl} from 'Config';

/**
 * @callback fetchUsersSpaces
 * @returns {Promise<object>} -- object with pagination metadata and list of user's spaces
 */

/**
 * @ngdoc method
 *
 * @description
 * Given a pair of authentication methods provided by the
 * 'Authentication' service return a function that fetches user's spaces
 *
 * @param {Authentication} auth - Authentication service
 * @returns {fetchUsersSpaces} - function to fetch user's spaces
 */
export function makeFetchSpacesWithAuth (auth) {
  const fetch = makeFetch(auth);

  return function () {
    return fetch({
      method: 'GET',
      url: apiUrl('spaces'),
      headers: {
        'Content-Type': 'application/vnd.contentful.management.v1+json'
      }
    }).then(({ data }) => data);
  };
}
