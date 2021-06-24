import * as accessChecker from './AccessChecker';
import { isAdmin, getSpaceRoles, getSpaceData } from 'core/services/SpaceEnvContext/utils';
import { routes } from 'core/react-routing';
import type { RouteDefinition, CreateRouteDefinition } from 'core/react-routing';

/**
 * This service makes use of accessChecker's section visibility data to expose
 * utility methods for checking access and redirecting to sections (top menu).
 */

// Migrated to react-router pages must use `routes`, which returns CreateRoute able to build a path based on a current space/env.
const SECTION_ACCESS_ORDER: [string, RouteDefinition | CreateRouteDefinition][] = [
  ['entry', routes['entries.list']],
  ['contentType', routes['content_types.list']],
  ['asset', routes['assets.list']],
  ['apiKey', routes['api.keys.list']],
  ['settings', routes['users.list']],
];

/**
 * Returns the first accessible sref of a space. It's relative
 * to `spaces.detail`. Returns `null` if no section can be accessed.
 */
export function getFirstAccessibleSref(space) {
  const visibility = accessChecker.getSectionVisibility();
  const section = SECTION_ACCESS_ORDER.find((section) => visibility[section[0]]);

  let firstAccessible = Array.isArray(section) ? section[1] : null;
  if (typeof firstAccessible === 'function') {
    firstAccessible = firstAccessible({ withEnvironment: false });
  }

  const userIsAdmin = isAdmin(space);
  const userIsAuthorOrEditor = accessChecker.isAuthorOrEditor(getSpaceRoles(space));
  const notActivated = !getSpaceData(space)?.activatedAt;

  return (notActivated && userIsAdmin) || userIsAuthorOrEditor
    ? { path: '.home' }
    : firstAccessible;
}
