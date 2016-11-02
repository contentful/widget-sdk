'use strict';

/**
 * @ngdoc service
 * @name subscriptionNotifier
 */
angular.module('contentful')
.factory('subscriptionNotifier', ['require', function (require) {
  var $rootScope = require('$rootScope');
  var trackPersistentNotification = require('analyticsEvents/persistentNotification');
  var TheAccountView = require('TheAccountView');
  var OrganizationList = require('OrganizationList');
  var htmlEncode = require('encoder').htmlEncode;
  var openPaywall = require('paywallOpener').openPaywall;
  var Subscription = require('Subscription');

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
    var userOwnsOrganization = OrganizationList.isOwner(organization);
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
      notify(limitedFreeVersionMsg(organization.subscriptionPlan));
    }

    function notify (message) {
      var params = {message: message};
      if (userOwnsOrganization) {
        params.actionMessage = 'Choose a plan';
        params.action = upgradeAction;
      }
      $rootScope.$broadcast('persistentNotification', params);
    }
  }

  function upgradeAction () {
    trackPersistentNotification.action('Plan Upgrade');
    TheAccountView.goToSubscription();
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

  function limitedFreeVersionMsg (subscriptionPlan) {
    var name = dotty.get(subscriptionPlan, 'name', 'free').toLowerCase();
    return '<strong>Limited free version.</strong> You are currently enjoying ' +
      'our limited ' + name + ' plan. To get access to all features, ' +
      'please upgrade to a paid subscription plan.';
  }

  function timeTpl (str, timeParams) {
    return _.template(str)(timeParams);
  }

}]);
