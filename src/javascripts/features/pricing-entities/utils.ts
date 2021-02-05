import { OrganizationEndpoint } from './types/Generic';

import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

/**
 * Wraps the given `endpoint` with the subscription-api alpha header.
 *
 * Simplifies the boilerplate of importing and generating the alpha header.
 */
export function withAlphaHeader<T = null>(endpoint: OrganizationEndpoint) {
  return async function callWithAlphaHeader(config: unknown) {
    return (endpoint(config, alphaHeader) as unknown) as T;
  };
}
