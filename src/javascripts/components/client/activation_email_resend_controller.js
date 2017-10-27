'use strict';

angular.module('contentful')
.factory('activationEmailResendController', ['require', function (require) {
  var $timeout = require('$timeout');
  var $q = require('$q');
  var moment = require('moment');
  var TokenStore = require('services/TokenStore');
  var modalDialog = require('modalDialog');
  var resendActivationEmail = require('activationEmailResender').resend;
  var TheStore = require('TheStore');

  var HOUR_IN_MS = 1000 * 60 * 60;
  var HOURS_BEFORE_REOPEN_DIALOG = 24;
  var store = TheStore.forKey('lastActivationEmailResendReminderTimestamp');

  return { init: init };

  function init () {
    storeDialogLastShownTimestamp(); // Wait 24h before showing the dialog.
    TokenStore.user$.onValue(watcher);
  }

  function watcher (user) {
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

  function showDialog (email) {
    var dialog = modalDialog.open({
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

    function resendEmail () {
      dialog.scope.isSending = true;
      dialog.scope.wasUnableToSend = false;
      resendActivationEmailWithDelay(email, 1300)
      .then(function () {
        showResentEmailConfirmation(email);
        dialog.confirm();
      }, function () {
        dialog.scope.isSending = false;
        dialog.scope.wasUnableToSend = true;
      });
    }
  }

  function showResentEmailConfirmation (email) {
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

  function resendActivationEmailWithDelay (email, delay) {
    var delayed = $timeout(_.noop, delay);
    return resendActivationEmail(email)
    .then(function () {
      return delayed;
    }, function () {
      return delayed.then(function () {
        return $q.reject();
      });
    });
  }

  function getMillisecondsUntilDialogCanBeReopened () {
    var lastMoment = fetchDialogLastShownTimestamp();
    if (lastMoment) {
      var msSinceLastShown = moment().diff(lastMoment, 'milliseconds');
      // Use Math.abs() since the user might have messed around with the clock and
      // we do not want to completely ignore future dates created this way.
      return Math.max(0,
        HOUR_IN_MS * HOURS_BEFORE_REOPEN_DIALOG - Math.abs(msSinceLastShown));
    } else {
      return 0;
    }
  }

  function fetchDialogLastShownTimestamp () {
    var lastUnixTimestamp = store.get();
    if (lastUnixTimestamp) {
      var lastShown = moment.unix(lastUnixTimestamp);
      return lastShown.isValid() ? lastShown : null;
    } else {
      return null;
    }
  }

  function storeDialogLastShownTimestamp () {
    store.set(moment().unix());
  }

}]);
