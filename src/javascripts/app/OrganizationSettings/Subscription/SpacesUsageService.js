import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';
const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

export const getSpacesUsage = (endpoint, query) => {
  return endpoint(
    {
      method: 'GET',
      path: ['spaces_usage'],
      query,
    },
    alphaHeader
  );
};
