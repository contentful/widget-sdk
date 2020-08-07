import resolveTokenLinks from './resolveTokenLinks';
import makeFetch from 'data/Request';
import { apiUrl } from 'Config';
import * as logger from 'services/logger';

/**
 * @description
 * Given a pair of authentication methods provided by the
 * 'Authentication' service return a function that fetches the token
 * data from the CMA.
 *
 * The links in the token data are resolved.
 *
 * Tested as part of the 'TokenStore` module.
 */
export default function makeFetchWithAuth(auth) {
  const doFetch = makeFetch(auth);
  const request = {
    method: 'GET',
    url: apiUrl('token'),
    headers: {
      'Content-Type': 'application/vnd.contentful.management.v1+json',
    },
  };

  return async () => {
    try {
      const response = await doFetch(request);

      if (response.data) {
        // Locales are always fetched from the `/locales` endpoint.
        // Do not resolve links to locales.
        delete response.data.includes.Locale;

        // TODO freeze returned object
        return resolveTokenLinks(response.data);
      } else {
        logError('Obtained /token info without `data`', response);
        throw new Error();
      }
    } catch {
      // Throw a consistent error, rather than the possible error from `doFetch`
      throw new Error('Could not obtain token info');
    }
  };

  function logError(message, { data, status, statusText }) {
    // We don't want e.g. `config` in here which contains secrets.
    const error = { request, data, status, statusText };
    logger.logServerError(message, { error });
  }
}
