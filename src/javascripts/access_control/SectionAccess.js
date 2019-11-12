import * as accessChecker from './AccessChecker';
import { getModule } from 'NgRegistry';

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
  const spaceContext = getModule('spaceContext');

  const visibility = accessChecker.getSectionVisibility();
  const section = SECTION_ACCESS_ORDER.find(section => visibility[section[0]]);

  const firstAccessible = Array.isArray(section) ? section[1] : null;
  const userIsAdmin = spaceContext.getData('spaceMember.admin', false);
  const userIsAuthorOrEditor = accessChecker.isAuthorOrEditor(
    spaceContext.getData('spaceMember.roles', false)
  );
  const notActivated = !spaceContext.getData('activatedAt');

  return (notActivated && userIsAdmin) || userIsAuthorOrEditor ? '.home' : firstAccessible;
}
