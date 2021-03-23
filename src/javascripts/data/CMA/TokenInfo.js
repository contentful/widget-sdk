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
    let response;

    try {
      response = await doFetch(request);
    } catch (err) {
      Object.assign(err, { request });
      logger.logException(err);

      throw new Error('Could not fetch token data');
    }

    if (response.data) {
      // Locales are always fetched from the `/locales` endpoint.
      // Do not resolve links to locales.
      delete response.data.includes.Locale;

      try {
        // TODO freeze returned object
        return resolveTokenLinks(response.data);
      } catch (err) {
        const resolveLinksError = new Error('Resolving token links threw');
        Object.assign(resolveLinksError, { request, response });

        logger.logException(resolveLinksError);

        throw new Error('Could not fetch token data');
      }
    } else {
      const noDataError = new Error('Obtained /token info without `data`');
      Object.assign(noDataError, { request, response });

      logger.logException(noDataError);

      throw new Error('Could not fetch token data');
    }
  };
}
