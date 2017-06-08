'use strict';

/**
 * @ngdoc service
 * @name subscriptionNotifier
 */
angular.module('contentful')
.factory('subscriptionNotifier', ['require', function (require) {
  var OrganizationList = require('services/OrganizationList');
  var openPaywall = require('paywallOpener').openPaywall;
  var Subscription = require('Subscription');

  return {
    /**
     * @ngdoc method
     * @name subscriptionNotifier#notifyAbout
     * @param {Object} organization
     * @description
     * Triggers the paywall
     */
    notifyAbout: notifyAbout
  };

  function notifyAbout (organization) {
    var userOwnsOrganization = OrganizationList.isOwner(organization);
    var subscription = Subscription.newFromOrganization(organization);

    if (!subscription) {
      return;
    } else if (subscription.isTrial() && subscription.hasTrialEnded()) {
      openPaywall(organization, {offerPlanUpgrade: userOwnsOrganization});
    }
  }
}]);
