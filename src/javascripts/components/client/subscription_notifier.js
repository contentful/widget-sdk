'use strict';

/**
 * @ngdoc service
 * @name subscriptionNotifier
 */
angular.module('contentful')
.factory('subscriptionNotifier', ['require', require => {
  const OrganizationRoles = require('services/OrganizationRoles');
  const openPaywall = require('paywallOpener').openPaywall;
  const Subscription = require('Subscription');

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
    const userOwnsOrganization = OrganizationRoles.isOwner(organization);
    const subscription = Subscription.newFromOrganization(organization);

    if (!subscription) {
      return;
    } else if (subscription.isTrial() && subscription.hasTrialEnded()) {
      openPaywall(organization, {offerPlanUpgrade: userOwnsOrganization});
    }
  }
}]);
