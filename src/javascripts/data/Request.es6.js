import wrapWithRetry from 'data/Request/Retry.es6';
import wrapWithAuth from 'data/Request/Auth.es6';
import { getEndpoint } from 'data/Request/Utils.es6';
import * as Telemetry from 'i13n/Telemetry.es6';
import { getModule } from 'NgRegistry.es6';

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
