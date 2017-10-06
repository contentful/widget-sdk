import $q from '$q';
import resolveTokenLinks from './resolveTokenLinks';
import makeFetch from 'data/Request';
import {apiUrl} from 'Config';


/**
 * @description
 * Given a pair of authentication methods provided by the
 * 'Authentication' service return a function that fetches the token
 * data from the CMA.
 *
 * The links in the token data are resolved.
 *
 * Tested as part of the 'tokenStore` module.
 */
export default function makeFetchWithAuth (auth) {
  const fetch = makeFetch(auth);

  return function () {
    return fetch({
      method: 'GET',
      url: apiUrl('token'),
      headers: {
        'Content-Type': 'application/vnd.contentful.management.v1+json'
      }
    }).then((response) => {
      const data = response.data;
      if (data) {
        // TODO freeze returned object
        return resolveTokenLinks(data);
      } else {
        return $q.reject(new Error('Could not obtain token info'));
      }
    });
  };
}
