import wrapWithRetry from 'data/Request/Retry.es6';
import wrapWithAuth from 'data/Request/Auth.es6';
import * as Telemetry from 'Telemetry.es6';
import { getModule } from 'NgRegistry.es6';
import { logError, logWarn } from 'services/logger.es6';
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
    try {
      const [{ url } = {}] = args;

      Telemetry.count('cma-req', {
        endpoint: getEndpoint(url)
      });
    } catch (error) {
      logError('Error during telemetry reporting for cma request', {
        groupingHash: 'telemetry-cma-req',
        error
      });
    }

    return request(...args);
  };
}

function getEndpoint(url) {
  const entitiesToStabilize = [
    'entries',
    'content_types',
    'assets',
    'extensions',
    'locales',
    'webhook_definitions',
    'roles',
    'snapshots',
    'space_memberships',
    'api_keys',
    'preview_api_keys',
    'access_tokens',
    'states',
    'user_states',
    'comments'
  ];

  if (url || url === '') {
    const urlComponents = url.split('?')[0].split('/');
    const resource = urlComponents.pop();
    const entity = urlComponents.pop();

    if (entitiesToStabilize.includes(entity)) {
      // replace all ids with just :id to provide a stable
      // tag value for endpoint tag in librato
      return `/${entity}/:id`;
    }

    return `/${resource}`;
  }

  logWarn('Invalid resource requested', {
    groupingHash: 'telemetry-cma-req',
    url
  });

  return 'INVALID_RESOURCE';
}
