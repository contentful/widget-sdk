import { trim, uniq } from 'lodash';

/**
 * Get a string of emails separated by comma or line breaks
 * and return an array of unique addresses
 */
export function parseEmails(emails = '') {
  const list = emails
    .split(/\n|,/)
    .map(trim)
    .filter(email => email.length > 0);

  return uniq(list);
}
