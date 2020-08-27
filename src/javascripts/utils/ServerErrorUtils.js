import { get } from 'lodash';

export function isTaken(error) {
  const status = get(error, 'statusCode');
  const errors = get(error, 'data.details.errors', []);

  return status === 422 && errors.some((e) => e.name === 'taken');
}

export function isForbidden(error) {
  return error.statusCode === 403;
}

// used to detect the rate limiting of some action (e.g. inviting the same user multiple times)
// NOT used to detect common API request rate limits (HTTP 429 error)
export function isRateLimit(error) {
  return error?.data?.sys?.id === 'RateLimitExceeded' ?? false;
}
