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
.factory('dialogsInitController', ['require', function (require) {

  var $rootScope = require('$rootScope');
  var spaceContext = require('spaceContext');
  var OrganizationList = require('OrganizationList');
  var activationEmailResendController = require('activationEmailResendController');
  var onboardingController = require('onboardingController');
  var subscriptionNotifier = require('subscriptionNotifier');
  var billingNotifier = require('billingNotifier');

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

    initSpaceWatcher();
  }

  function onSpaceChanged () {
    var organization = spaceContext.getData('organization') || {};

    subscriptionNotifier.notifyAbout(organization);
    billingNotifier.notifyAbout(organization);
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
    onSpaceChanged();
  }

}]);
