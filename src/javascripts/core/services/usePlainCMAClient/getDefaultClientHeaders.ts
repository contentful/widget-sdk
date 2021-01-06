import * as BackendTracing from 'i13n/BackendTracing';
import { gitRevision, env } from 'Config';

// these headers are sent in all requests
export function getDefaultHeaders() {
  const userAgentParts = ['app contentful.web-app', 'platform browser'];

  // Add active git revision to headers
  if (gitRevision) {
    userAgentParts.push(`sha ${gitRevision}`);
  }

  // Add environment, so that local dev versus direct traffic can be differentiated
  if (env !== 'production') {
    userAgentParts.push(`env ${env}`);
  }

  return {
    // we should be accepting only application/json. this is left over from $http
    Accept: 'application/json, text/plain, */*',
    'X-Contentful-User-Agent': userAgentParts.join('; '),
    'Content-Type': 'application/vnd.contentful.management.v1+json',
    ...BackendTracing.tracingHeaders(),
  };
}
