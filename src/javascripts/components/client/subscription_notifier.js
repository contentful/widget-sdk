'use strict';

/**
 * @ngdoc service
 * @name subscriptionNotifier
 */
angular.module('contentful')
.factory('subscriptionNotifier', ['$injector', function ($injector) {

  var $rootScope = $injector.get('$rootScope');
  var analytics = $injector.get('analytics');
  var TheAccountView = $injector.get('TheAccountView');
  var OrganizationList = $injector.get('OrganizationList');
  var htmlEncode = $injector.get('encoder').htmlEncode;
  var openPaywall = $injector.get('paywallOpener').openPaywall;
  var Subscription = $injector.get('Subscription');

  return {
    /**
     * @ngdoc method
     * @name subscriptionNotifier#notifyAbout
     * @param {Object} organization
     * @description
     * Sets/updates the notifier's context and will trigger the appropriate
     * notifications and paywall.
     */
    notifyAbout: notifyAbout
  };

  function notifyAbout (organization) {
    var organizationId = dotty.get(organization, 'sys.id');
    var userOwnsOrganization = OrganizationList.isOwner(organizationId);
    var subscription = Subscription.newFromOrganization(organization);

    if (!subscription) {
      return;
    } else if (subscription.isTrial()) {
      if (subscription.hasTrialEnded()) {
        notify(trialEndMsg(organization, userOwnsOrganization));
        openPaywall(organization, {offerPlanUpgrade: userOwnsOrganization});
      } else {
        var hoursLeft = subscription.getTrialHoursLeft();
        notify(timeLeftInTrialMsg(hoursLeft, organization, userOwnsOrganization));
      }
    } else if (subscription.isLimitedFree()) {
      notify(limitedFreeVersionMsg());
    }

    function notify (message) {
      var params = {message: message};
      if (userOwnsOrganization) {
        params.actionMessage = 'Choose a plan';
        params.action = newUpgradeAction(trackPlanUpgrade);
      }
      $rootScope.$broadcast('persistentNotification', params);

      function trackPlanUpgrade () {
        analytics.trackPersistentNotificationAction('Plan Upgrade');
      }
    }
  }

  function newUpgradeAction (trackingFn) {
    return function upgradeAction () {
      trackingFn();
      TheAccountView.goToSubscription();
    };
  }

  function trialEndMsg (organization, userIsOrganizationOwner) {
    var baseMsg = '<strong>Your trial is over.</strong> All your ' +
      htmlEncode(organization.name) + ' organization’s spaces are now in ' +
      'read-only mode. ';

    var ownerMsg = 'Please choose a plan now to continue managing and ' +
      'delivering content.';

    var userMsg = 'Please talk to one of your organization owners who can ' +
      'take care of this matter.';

    return baseMsg + (userIsOrganizationOwner ? ownerMsg : userMsg);
  }

  function timeLeftInTrialMsg (hoursLeft, organization, userIsOrganizationOwner) {
    var timePeriod = hoursLeft / 24 <= 1
      ? {length: hoursLeft, unit: 'hours'}
      : {length: Math.floor(hoursLeft / 24), unit: 'days'};

    var baseMsg = timeTpl('<strong>Please keep in mind that your ' +
      htmlEncode(organization.name) + ' organization’s trial will ' +
      'expire in <%- length %> <%- unit %>.</strong> ', timePeriod);

    var ownerMsg = 'Make the most out of it! Or see the real plans if you’re ' +
      'ready to choose a subscription plan.';

    var userMsg = 'Your subscription can be upgraded by one of the ' +
      'organization owners.';

    return baseMsg + (userIsOrganizationOwner ? ownerMsg : userMsg);
  }

  function limitedFreeVersionMsg () {
    return '<strong>Limited free version.</strong> You are currently ' +
      'enjoying our limited Starter plan. To get access to all features, ' +
      'please upgrade to a paid subscription plan.';
  }

  function timeTpl (str, timeParams) {
    return _.template(str)(timeParams);
  }

}]);
