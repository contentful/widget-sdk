import * as Sentry from '@sentry/browser';
import * as Config from 'Config';
import * as CallBuffer from 'utils/CallBuffer';

const callBuffer = CallBuffer.create();

let enabled = false;

export function enable(user) {
  if (enabled) {
    return;
  }

  Sentry.init({
    dsn: Config.services.sentry.dsn,
    release: Config.gitRevision,
    environment: Config.env,
    normalizeDepth: 10,
    // We can revisit later as necessary
    requestBodies: 'never',
  });

  Sentry.setUser(minimizedUser(user));

  enabled = true;
  callBuffer.resolve();
}

export function logMessage(message, context) {
  callBuffer.call(() => {
    const { tags, level, extra } = context;

    if (enabled) {
      Sentry.captureMessage(message, {
        level,
        tags,
        extra,
      });
    }
  });
}

export function logException(exception, context) {
  callBuffer.call(() => {
    if (enabled) {
      Sentry.captureException(exception, {
        extra: context,
      });
    }
  });
}

export function addBreadcrumb(breadcrumb) {
  callBuffer.call(() => {
    if (enabled) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  });
}

/**
 * We don't want to send all the data that's on the user object to Sentry. This returns
 * a minimal set of data, the user ID, admin link, and organizations that the user has.
 * @param  {User} user
 * @return {Object}      Minimal user data
 */
function minimizedUser(user) {
  if (user?.sys?.id) {
    return {
      id: user.sys.id,
      adminLink: getAdminLink(user),
      organizations: getOrganizations(user),
    };
  }
}

function getOrganizations(user) {
  const organizationMemberships = user.organizationMemberships || [];
  return organizationMemberships.map((membership) => membership.organization.sys.id).join(', ');
}

function getAdminLink(user) {
  return 'https://admin.' + Config.domain + '/admin/users/' + user.sys.id;
}
