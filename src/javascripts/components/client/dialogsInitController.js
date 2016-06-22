'use strict';

/**
 * @ngdoc service
 * @name dialogsInitController
 *
 * @description
 * Takes care of initialization of modal dialog related global, lifelong services.
 * Controlls how certain global dialogs play together to prevent them interfering
 * with eachother.
 */
angular.module('contentful')
.factory('dialogsInitController', ['$injector', function ($injector) {

  var $rootScope                      = $injector.get('$rootScope');
  var activationEmailResendController = $injector.get('activationEmailResendController');
  var onboardingController            = $injector.get('onboardingController');
  var trialWatcher                    = $injector.get('TrialWatcher');
  var billingNotificationsController = $injector.get('billingNotificationsController');

  return {
    init: init
  };

  function init () {
    // Make sure activation email resend dialog is not shown together with onboarding.
    // After onboarding wait 24h before reminding the user about the activation email.
    $rootScope.$on('cfOmitOnboarding', function () {
      activationEmailResendController.init();
    });
    $rootScope.$on('cfAfterOnboarding',
      activationEmailResendController.init.bind(null, { skipOnce: true }));

    onboardingController.init();
    trialWatcher.init();
    billingNotificationsController.init();
  }

}]);
