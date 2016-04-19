'use strict';

/**
 * @ngdoc service
 * @name modalDialog
 * @description
 * Opens the paywall.
 */
angular.module('contentful')
.factory('paywallOpener', ['$injector', function ($injector) {

  var modalDialog      = $injector.get('modalDialog');
  var intercom         = $injector.get('intercom');
  var analytics        = $injector.get('analytics');
  var TheAccountView   = $injector.get('TheAccountView');

  var paywallIsOpen = false;

  return {
    openPaywall: openPaywall
  };

  function openPaywall (organization, options) {
    if (paywallIsOpen) {
      return;
    }

    options = _.extend({
      offerPlanUpgrade: false
    }, options);

    trackPaywall('Viewed Paywall');
    paywallIsOpen = true;

    modalDialog.open({
      title: 'Paywall', // For generic Modal Dialog tracking.
      template: 'paywall_dialog',
      persistOnNavigation: true,
      scopeData: {
        offerToSetUpPayment: options.offerPlanUpgrade,
        setUpPayment: newUpgradeAction(),
        openIntercom: intercom.open
      }
    }).promise
    .catch(function () {
      trackPaywall('Cancelled Paywall');
    })
    .finally(function () {
      paywallIsOpen = false;
    });

    function trackPaywall (event) {
      analytics.track(event, {
        userCanUpgradePlan: options.offerPlanUpgrade,
        organizationName: organization.name
      });
    }

    function newUpgradeAction () {
      return function upgradeAction() {
        trackPaywall('Clicked Paywall Plan Upgrade Button');
        TheAccountView.goToSubscription();
      };
    }
  }

}]);
