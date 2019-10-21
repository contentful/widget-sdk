import _ from 'lodash';
import * as CallBuffer from 'utils/CallBuffer.es6';
import * as Config from 'Config.es6';
import * as LazyLoader from 'utils/LazyLoader.es6';

// Bugsnag wrapper.
// See https://bugsnag.com/docs/notifiers/js for more details

// TODO this should be stored in the environment configuration.
const API_KEY = 'b253f10d5d0184a99e1773cec7b726e8';

let bugsnag;
const callBuffer = CallBuffer.create();
const loadOnce = _.once(load);

/**
 * Loads bugsnag and sets the user information. Resolves the promise when
 * bugsnag has loaded.
 *
 * It will not reload bugsnag and set the user data if called multiple
 * times.
 */
export function enable(user) {
  return loadOnce(user);
}

export function disable() {
  callBuffer.disable();
}

export function notify() {
  const args = arguments;
  callBuffer.call(() => {
    if (bugsnag) {
      bugsnag.notify(...args);
    }
  });
}

export function notifyException() {
  const args = arguments;
  callBuffer.call(() => {
    if (bugsnag) {
      bugsnag.notifyException(...args);
    }
  });
}

/**
 * Records an event.
 *
 * The event trail is shown on bugsnag when an error occured.
 *
 * Note that the data object should only be one level deep and the
 * object’s values are limited to 140 characters each.
 *
 * https://docs.bugsnag.com/platforms/browsers/#leaving-breadcrumbs
 */
export function leaveBreadcrumb(name, data) {
  callBuffer.call(() => {
    if (bugsnag) {
      bugsnag.leaveBreadcrumb(name, data);
    }
  });
}

function load(user) {
  return LazyLoader.get('bugsnag').then(
    _bugsnag => {
      bugsnag = _bugsnag;
      // Do not patch `console.log`. It messes up stack traces
      bugsnag.disableAutoBreadcrumbsConsole();
      bugsnag.enableNotifyUnhandledRejections();
      bugsnag.apiKey = API_KEY;
      bugsnag.notifyReleaseStages = ['staging', 'production'];
      bugsnag.releaseStage = Config.env;
      bugsnag.appVersion = Config.gitRevision;
      setUserInfo(user, bugsnag);
      callBuffer.resolve();
    },
    () => callBuffer.disable()
  );
}

function setUserInfo(user, bugsnag) {
  const userId = _.get(user, ['sys', 'id']);
  if (userId) {
    bugsnag.user = {
      id: userId,
      adminLink: getAdminLink(user),
      organizations: getOrganizations(user)
    };
  }
}

function getOrganizations(user) {
  const organizationMemberships = user.organizationMemberships || [];
  return organizationMemberships.map(membership => membership.organization.sys.id).join(', ');
}

function getAdminLink(user) {
  const id = _.get(user, ['sys', 'id']);
  return 'https://admin.' + Config.domain + '/admin/users/' + id;
}
