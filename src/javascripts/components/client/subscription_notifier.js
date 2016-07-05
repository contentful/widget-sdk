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
        notify(trialHasEndedMsg(organization, userOwnsOrganization));
        openPaywall(organization, {offerPlanUpgrade: userOwnsOrganization});
      } else {
        var hoursLeft = subscription.getTrialHoursLeft();
        notify(timeLeftInTrialMsg(hoursLeft, organization, userOwnsOrganization));
      }
    } else if (subscription.isLimitedFree()) {
      notify(limitedFreeVersionMsg());
    } else {
      // Remove last notification. E.g. after switching into another
      // organization's space without any trial issues.
      $rootScope.$broadcast('persistentNotification', null);
    }

    function notify (message) {
      var params = {message: message};
      if (userOwnsOrganization) {
        params.actionMessage = 'Upgrade';
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

  function trialHasEndedMsg (organization, userIsOrganizationOwner) {
    var message = '<strong>Your trial has ended.</strong> The ' +
      htmlEncode(organization.name) + ' organization is in read-only mode.';

    if (userIsOrganizationOwner) {
      message += ' To continue adding content and using the API please ' +
        'insert your billing information.';
    } else {
      message += ' To continue using it please contact the account owner.';
    }
    return message;
  }

  function timeLeftInTrialMsg (hoursLeft, organization, userIsOrganizationOwner) {
    var timePeriod;
    if (hoursLeft / 24 <= 1) {
      timePeriod = {length: hoursLeft, unit: 'hours'};
    } else {
      timePeriod = {length: Math.floor(hoursLeft / 24), unit: 'days'};
    }

    var message = timeTpl('<strong>%length %unit left in trial.</strong> ' +
      'The organization ' + htmlEncode(organization.name) + ' is in trial mode ' +
      'giving you access to all features for %length more %unit.', timePeriod);

    if (userIsOrganizationOwner) {
      message += ' Enter your billing information to activate your subscription.';
    } else {
      message += ' Your subscription can be upgraded by one of the owners of your organization.';
    }
    return message;
  }

  function limitedFreeVersionMsg () {
    return '<strong>Limited free version.</strong> You are currently ' +
      'enjoying our limited Starter plan. To get access to all features, ' +
      'please upgrade to a paid subscription plan.';
  }

  function timeTpl (str, timePeriod) {
    return str
      .replace(/%length/g, timePeriod.length)
      .replace(/%unit/g, timePeriod.unit);
  }

}]);
