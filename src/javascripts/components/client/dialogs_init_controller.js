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
.factory('dialogsInitController', ['require', require => {
  var $rootScope = require('$rootScope');
  var spaceContext = require('spaceContext');
  var activationEmailResendController = require('activationEmailResendController');
  var subscriptionNotifier = require('subscriptionNotifier');

  return {
    init: init
  };

  function init () {
    activationEmailResendController.init();
    initSpaceWatcher();
  }

  function onSpaceChanged (spaceId) {
    if (!spaceId) {
      return;
    }
    // Reset notification related to the previous space.
    $rootScope.$broadcast('persistentNotification', null);

    var organization = spaceContext.organizationContext.organization || {};

    subscriptionNotifier.notifyAbout(organization);
  }

  function initSpaceWatcher () {
    $rootScope.$watch(() => spaceContext.getId(), onSpaceChanged);
  }
}]);
