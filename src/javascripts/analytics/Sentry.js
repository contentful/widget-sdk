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
  });

  Sentry.setUser(user);

  enabled = true;
  callBuffer.resolve();
}

export function logMessage(message, level, context) {
  callBuffer.call(() => {
    if (enabled) {
      Sentry.captureMessage(message, {
        level,
        extra: context,
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
