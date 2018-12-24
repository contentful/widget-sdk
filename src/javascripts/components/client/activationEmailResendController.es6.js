'use strict';

angular.module('contentful').factory('activationEmailResendController', [
  'require',
  require => {
    const _ = require('lodash');
    const $timeout = require('$timeout');
    const $q = require('$q');
    const moment = require('moment');
    const TokenStore = require('services/TokenStore.es6');
    const modalDialog = require('modalDialog');
    const resendActivationEmail = require('activationEmailResender').resend;
    const getStore = require('TheStore').getStore;

    const HOUR_IN_MS = 1000 * 60 * 60;
    const HOURS_BEFORE_REOPEN_DIALOG = 24;
    const store = getStore().forKey('lastActivationEmailResendReminderTimestamp');

    return { init: init };

    function init() {
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

    function showDialog(email) {
      const dialog = modalDialog.open({
        title: 'Please confirm your email address',
        template: 'activation_email_resend_dialog',
        persistOnNavigation: true,
        confirmLabel: 'OK, I got it',
        cancelLabel: false,
        scopeData: {
          isSending: false,
          wasUnableToSend: false,
          resendEmail: resendEmail
        }
      });
      return dialog;

      function resendEmail() {
        dialog.scope.isSending = true;
        dialog.scope.wasUnableToSend = false;
        resendActivationEmailWithDelay(email, 1300).then(
          () => {
            showResentEmailConfirmation(email);
            dialog.confirm();
          },
          () => {
            dialog.scope.isSending = false;
            dialog.scope.wasUnableToSend = true;
          }
        );
      }
    }

    function showResentEmailConfirmation(email) {
      return modalDialog.open({
        title: 'It’s on its way!',
        messageTemplate: 'activation_email_resend_confirmation',
        cancelLabel: false,
        disableTopCloseButton: true,
        scopeData: {
          email: email
        }
      });
    }

    function resendActivationEmailWithDelay(email, delay) {
      const delayed = $timeout(_.noop, delay);
      return resendActivationEmail(email).then(
        () => delayed,
        () => delayed.then(() => $q.reject())
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
  }
]);
