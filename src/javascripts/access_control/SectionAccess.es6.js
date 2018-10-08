import * as accessChecker from './AccessChecker';
import spaceContext from 'spaceContext';

/**
 * This service makes use of accessChecker's section visibility data to expose
 * utility methods for checking access and redirecting to sections (top menu).
 */

const SECTION_ACCESS_ORDER = [
  ['entry', '.entries.list'],
  ['contentType', '.content_types.list'],
  ['asset', '.assets.list'],
  ['apiKey', '.api.keys.list'],
  ['settings', '.settings.users.list']
];

/**
 * Returns the first accessible sref of a space. It's relative
 * to `spaces.detail`. Returns `null` if no section can be accessed.
 */
export function getFirstAccessibleSref() {
  const visibility = accessChecker.getSectionVisibility();
  const section = SECTION_ACCESS_ORDER.find(section => visibility[section[0]]);

  const firstAccessible = Array.isArray(section) ? section[1] : null;
  const userIsAdmin = spaceContext.getData('spaceMembership.admin', false);
  const notActivated = !spaceContext.getData('activatedAt');
  const shouldGoToHome = notActivated && userIsAdmin;

  return shouldGoToHome ? '.home' : firstAccessible;
}
