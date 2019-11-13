import { get } from 'lodash';

export function isTaken(error) {
  const status = get(error, 'statusCode');
  const errors = get(error, 'data.details.errors', []);

  return status === 422 && errors.some(e => e.name === 'taken');
}
