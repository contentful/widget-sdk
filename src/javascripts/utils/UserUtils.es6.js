import { isString } from 'lodash';

export function getUserName ({ firstName, lastName, email }) {
  const name = (firstName || lastName) ? `${firstName} ${lastName}` : email;

  return isString(name) ? name.trim() : '';
}
