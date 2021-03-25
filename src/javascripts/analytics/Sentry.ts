import * as Sentry from '@sentry/browser';
import * as Config from 'Config';
import * as CallBuffer from 'utils/CallBuffer';
import { User } from 'core/services/SpaceEnvContext/types';
import { ScopeContext } from '@sentry/types';

interface OptionalScopeContext {
  tags?: ScopeContext['tags'];
  level: ScopeContext['level'];
  extra?: ScopeContext['extra'];
}

const callBuffer = CallBuffer.create();

let enabled = false;

/**
 * Enable Sentry with the given user.
 * @param {User} user
 */
export function enable(user: User) {
  if (enabled) {
    return;
  }

  Sentry.init({
    dsn: Config.services.sentry.dsn,
    release: Config.gitRevision,
    environment: Config.env,
    normalizeDepth: 10,
  });

  Sentry.setUser(minimizedUser(user));

  enabled = true;
  callBuffer.resolve();
}

/**
 * Log an exception to Sentry.
 *
 * The given context expects at least `level` to be provided, and optionally
 * `tags` and `extra`.
 * @param {Error}                    exception
 * @param {Sentry.Severity.Error }}      context
 */
export function logException(
  exception: Error,
  context: OptionalScopeContext = { level: Sentry.Severity.Error }
) {
  callBuffer.call(() => {
    const { tags, level, extra } = context;

    if (enabled) {
      Sentry.captureException(exception, {
        level,
        tags,
        extra,
      });
    }
  });
}

/**
 * We don't want to send all the data that's on the user object to Sentry. This returns
 * a minimal set of data: the user ID, admin link, and organizations that the user has.
 */
function minimizedUser(user: User) {
  return {
    id: user.sys.id,
    adminLink: getAdminLink(user),
    organizations: getOrganizations(user),
  };
}

/**
 * Get all the organizations that the user has a membership to.
 * @param {User} user
 */
function getOrganizations(user: User) {
  const organizationMemberships = user.organizationMemberships || [];
  return organizationMemberships.map((membership) => membership.organization.sys.id).join(', ');
}

/**
 * Generate a GK admin link based on the user ID
 * @param {User} user
 */
function getAdminLink(user: User) {
  return 'https://admin.' + Config.domain + '/admin/users/' + user.sys.id;
}
