import { getModule } from 'NgRegistry';
import _ from 'lodash';
import moment from 'moment';
import {
  openActivationEmailResendDialog,
  openConfirmationEmailSentDialog,
} from './ActivationEmailResendDialog';
import { resendActivationEmail } from './activationEmailResender';

import { getStore } from 'browserStorage';
import * as TokenStore from 'services/TokenStore';

const HOUR_IN_MS = 1000 * 60 * 60;
const HOURS_BEFORE_REOPEN_DIALOG = 24;
const store = getStore().forKey('lastActivationEmailResendReminderTimestamp');

export function initActivationEmailResend() {
  storeDialogLastShownTimestamp(); // Wait 24h before showing the dialog.
  TokenStore.user$.onValue(watcher);
}

function watcher(user) {
  // Break if there's not enough data.
  if (!user) {
    return;
  }
  if (user.confirmed === false && user.email) {
    if (getMillisecondsUntilDialogCanBeReopened() <= 0) {
      showDialog(user.email);
      storeDialogLastShownTimestamp();
    }
  } else {
    store.remove();
  }
}

async function showDialog(email) {
  const result = await openActivationEmailResendDialog({
    doResendEmail: () => {
      return resendActivationEmailWithDelay(email, 1300);
    },
  });
  if (result) {
    await openConfirmationEmailSentDialog({ email });
  }
}

function resendActivationEmailWithDelay(email, delay) {
  const $timeout = getModule('$timeout');
  const delayed = $timeout(_.noop, delay);
  return resendActivationEmail(email).then(
    () => delayed,
    () => delayed.then(() => Promise.reject())
  );
}

function getMillisecondsUntilDialogCanBeReopened() {
  const lastMoment = fetchDialogLastShownTimestamp();
  if (lastMoment) {
    const msSinceLastShown = moment().diff(lastMoment, 'milliseconds');
    // Use Math.abs() since the user might have messed around with the clock and
    // we do not want to completely ignore future dates created this way.
    return Math.max(0, HOUR_IN_MS * HOURS_BEFORE_REOPEN_DIALOG - Math.abs(msSinceLastShown));
  } else {
    return 0;
  }
}

function fetchDialogLastShownTimestamp() {
  const lastUnixTimestamp = store.get();
  if (lastUnixTimestamp) {
    const lastShown = moment.unix(lastUnixTimestamp);
    return lastShown.isValid() ? lastShown : null;
  } else {
    return null;
  }
}

function storeDialogLastShownTimestamp() {
  store.set(moment().unix());
}
