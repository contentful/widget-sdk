'use strict';

// TODO: Move code for handling the notifications and paywall modal into a
//  separate TrialWatchController. The TrialWatchController should use TrialWatcher
//  as a service reduced to expose trial related information.
angular.module('contentful').factory('TrialWatcher', ['$injector', function ($injector) {

  var $rootScope       = $injector.get('$rootScope');
  var intercom         = $injector.get('intercom');
  var analytics        = $injector.get('analytics');
  var TheAccountView   = $injector.get('TheAccountView');
  var modalDialog      = $injector.get('modalDialog');
  var spaceContext     = $injector.get('spaceContext');
  var OrganizationList = $injector.get('OrganizationList');
  var htmlEncode       = $injector.get('encoder').htmlEncode;
  var moment           = $injector.get('moment');

  var lastSpaceId   = spaceContext.getId();
  var trialHasEnded = false;
  var paywallIsOpen = false;

  return {
    init:     init,
    hasEnded: function () { return trialHasEnded; }
  };

  function init() {
    $rootScope.$watchCollection(function () {
      return {
        spaceId: spaceContext.getId(),
        isInitialized: !OrganizationList.isEmpty()
      };
    }, trialWatcher);
  }

  function trialWatcher (args) {
    if (!args.spaceId || !args.isInitialized || args.spaceId === lastSpaceId) {
      return;
    }

    lastSpaceId   = args.spaceId;
    trialHasEnded = false;

    var organization = spaceContext.getData('organization');
    var organizationId = dotty.get(organization, 'sys.id');
    var userOwnsOrganization = OrganizationList.isAdminOrOwner(organizationId);

    if (organizationHasTrialSubscription(organization)) {
      if (hasTrialEnded(organization)) {
        trialHasEnded = true;
        notify(trialHasEndedMsg(organization, userOwnsOrganization));
        showPaywall(organization.name, userOwnsOrganization);
      } else {
        notify(timeLeftInTrialMsg(organization, userOwnsOrganization));
      }
    } else if (organizationHasLimitedFreeSubscription(organization)) {
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

  function showPaywall (organizationName, userOwnsOrganization) {
    if (paywallIsOpen) {
      return;
    }

    trackPaywall('Viewed Paywall');

    paywallIsOpen = true;
    modalDialog.open({
      title: 'Paywall', // For generic Modal Dialog tracking.
      template: 'paywall_dialog',
      persistOnNavigation: true,
      scopeData: {
        offerToSetUpPayment: userOwnsOrganization,
        setUpPayment: newUpgradeAction(trackPaywallPlanUpgrade),
        openIntercom: intercom.open
      }
    }).promise
    .catch(function (){
      trackPaywall('Cancelled Paywall');
    })
    .finally(function () {
      paywallIsOpen = false;
    });

    function trackPaywallPlanUpgrade () {
      trackPaywall('Clicked Paywall Plan Upgrade Button');
    }

    function trackPaywall (event) {
      analytics.track(event, {
        userCanUpgradePlan: userOwnsOrganization,
        organizationName: organizationName
      });
    }
  }

  function newUpgradeAction(trackingFn){
    return function upgradeAction() {
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

  function timeLeftInTrialMsg (organization, userIsOrganizationOwner) {
    var hours = getTrialHoursLeft(organization);
    var timePeriod;
    if (hours / 24 <= 1) {
      timePeriod = {length: hours, unit: 'hours'};
    } else {
      timePeriod = {length: Math.floor(hours / 24), unit: 'days'};
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

  function timeTpl(str, timePeriod) {
    return str.
      replace(/%length/g, timePeriod.length).
      replace(/%unit/g, timePeriod.unit);
  }

  function organizationHasLimitedFreeSubscription (organization) {
    return organization.subscriptionState == 'active' &&
      !organization.subscriptionPlan.paid &&
      organization.subscriptionPlan.kind == 'default';
  }

  function organizationHasTrialSubscription (organization) {
    return organization.subscriptionState === 'trial';
  }

  function getTrialHoursLeft (organization) {
    return moment(organization.trialPeriodEndsAt).diff(moment(), 'hours');
  }

  function hasTrialEnded (organization) {
    return !moment(organization.trialPeriodEndsAt).isAfter(moment());
  }
}]);
