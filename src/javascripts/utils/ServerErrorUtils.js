import { get } from 'lodash';

export function isTaken(error) {
  const status = get(error, 'statusCode');
  const errors = get(error, 'data.details.errors', []);

  return status === 422 && errors.some(e => e.name === 'taken');
}

export function isForbidden(error) {
  return error.statusCode === 403;
}

export function isEntityUnprocessable(error) {
  return error.statusCode === 422;
}

// temporary helper function to get error message
export function getErrorBaseMessage(data) {
  // temporary solution to display backend error message
  const errorDetails = data.details.errors.map(item => item.value.errors)[0].base;

  return errorDetails;
}
