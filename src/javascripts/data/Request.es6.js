import wrapWithRetry from 'data/Request/Retry.es6';
import wrapWithAuth from 'data/Request/Auth.es6';
import * as Telemetry from 'Telemetry.es6';
import { getModule } from 'NgRegistry.es6';

const $http = getModule('$http');

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
  return wrapWithCounter(wrapWithAuth(auth, wrapWithRetry($http)));
}

function wrapWithCounter(request) {
  return (...args) => {
    Telemetry.count('cma-req');
    return request(...args);
  };
}
