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

  var $rootScope = $injector.get('$rootScope');
  var spaceContext = $injector.get('spaceContext');
  var OrganizationList = $injector.get('OrganizationList');
  var activationEmailResendController = $injector.get('activationEmailResendController');
  var onboardingController = $injector.get('onboardingController');
  var trialWatcher = $injector.get('TrialWatcher');
  var billingNotifier = $injector.get('billingNotifier');

  var lastSpaceId = spaceContext.getId();

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

    initSpaceWatcher();
  }

  function initSpaceWatcher () {
    $rootScope.$watchCollection(function () {
      return {
        spaceId: spaceContext.getId(),
        isInitialized: !OrganizationList.isEmpty()
      };
    }, watchSpace);
  }

  function watchSpace (args) {
    if (!args.spaceId || !args.isInitialized || args.spaceId === lastSpaceId) {
      return;
    }

    lastSpaceId = args.spaceId;
    var organization = spaceContext.getData('organization') || {};

    billingNotifier.notifyAbout(organization);
  }

}]);
