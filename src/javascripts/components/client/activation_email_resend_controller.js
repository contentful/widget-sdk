'use strict';

angular.module('contentful')
.factory('activationEmailResendController', ['$injector', function ($injector){

  var $rootScope            = $injector.get('$rootScope');
  var $timeout              = $injector.get('$timeout');
  var $q                    = $injector.get('$q');
  var moment                = $injector.get('moment');
  var authentication        = $injector.get('authentication');
  var modalDialog           = $injector.get('modalDialog');
  var resendActivationEmail = $injector.get('activationEmailResender').resend;
  var TheStore              = $injector.get('TheStore');

  var HOUR_IN_MS = 1000 * 60 * 60;
  var HOURS_BEFORE_REOPEN_DIALOG = 24;
  var LAST_REMINDER_STORE_KEY = 'lastActivationEmailResendReminderTimestamp';

  return {
    init: init,
    LAST_REMINDER_STORE_KEY: LAST_REMINDER_STORE_KEY
  };

  function init (options) {
    options = options || {};
    if (options.skipOnce) { // Wait 24h before showing the dialog.
      storeDialogLastShownTimestamp();
    }
    $rootScope.$watch(function () {
      return dotty.get(authentication, 'tokenLookup.sys.createdBy');
    }, watcher);
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
      // Makes sure to show the dialog again if user keeps the tab open.
      setTimeout(watcher.bind(null, user),
        getMillisecondsUntilDialogCanBeReopened());
    } else {
      TheStore.remove(LAST_REMINDER_STORE_KEY);
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
    var lastUnixTimestamp = TheStore.get(LAST_REMINDER_STORE_KEY);
    if (lastUnixTimestamp) {
      var lastShown = moment.unix(lastUnixTimestamp);
      return lastShown.isValid() ? lastShown : null;
    } else {
      return null;
    }
  }

  function storeDialogLastShownTimestamp () {
    TheStore.set(LAST_REMINDER_STORE_KEY, moment().unix());
  }

}]);
