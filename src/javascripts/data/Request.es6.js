import $http from '$http';
import wrapWithRetry from 'data/Request/Retry';
import wrapWithAuth from 'data/Request/Auth';

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
  return wrapWithAuth(auth, wrapWithRetry($http));
}
