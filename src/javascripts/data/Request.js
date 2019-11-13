import wrapWithRetry from 'data/Request/Retry';
import wrapWithAuth from 'data/Request/Auth';
import { getEndpoint } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';
import { getModule } from 'NgRegistry';

/**
 * @description
 * Create a HTTP request function that handles authentication and
 * retries.
 *
 * The two parameters are provided by the 'Authentication' module.
 *
 * See the wrapper documentation for details.
 */
export default function makeRequest(auth) {
  const $http = getModule('$http');

  return wrapWithCounter(wrapWithAuth(auth, wrapWithRetry($http)));
}

function wrapWithCounter(request) {
  return (...args) => {
    const [{ url } = {}] = args;

    Telemetry.count('cma-req', {
      endpoint: getEndpoint(url)
    });

    return request(...args);
  };
}
