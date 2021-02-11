import { getAlphaHeader, SUBSCRIPTIONS_API } from 'alphaHeaders.js';
import { OrganizationEndpoint, RequestConfig } from 'data/CMA/types';

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

/**
 * Wraps the given `endpoint` with the subscription-api alpha header.
 *
 * Simplifies the boilerplate of importing and generating the alpha header.
 */
export function withAlphaHeader<T = null>(endpoint: OrganizationEndpoint) {
  return async function callWithAlphaHeader(config: RequestConfig) {
    return endpoint<T>(config, alphaHeader);
  };
}
