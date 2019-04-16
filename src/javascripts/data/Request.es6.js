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
    const [{ url } = {}] = args;

    Telemetry.count('cma-req', {
      endpoint: getEndpoint(url)
    });

    return request(...args);
  };
}

function getEndpoint(url) {
  const segments = url
    .split('?')[0]
    .split('/')
    .slice(3);
  const makeStableName = idx => `/${segments[idx]}${segments[idx + 1] ? '/:id' : ''}`;

  if (segments.length <= 2) {
    return `/${segments.join('/')}`;
  }

  if (segments[2] === 'environments' && segments.length > 3) {
    return makeStableName(4);
  } else {
    return makeStableName(2);
  }
}
