'use strict';

angular.module('contentful').factory('TrialWatcher', ['$injector', function ($injector) {

  var $rootScope     = $injector.get('$rootScope');
  var intercom       = $injector.get('intercom');
  var analytics      = $injector.get('analytics');
  var TheAccountView = $injector.get('TheAccountView');
  var modalDialog    = $injector.get('modalDialog');
  var spaceContext   = $injector.get('spaceContext');
  var authentication = $injector.get('authentication');
  var TrialInfo      = $injector.get('TrialInfo');
  var htmlEncode     = $injector.get('encoder').htmlEncode;

  var UNKNOWN_USER_ID = {};
  var previousUserId  = UNKNOWN_USER_ID;
  var hasTrialEnded   = false;
  var paywallIsOpen   = false;

  return {
    init:     init,
    hasEnded: function () { return hasTrialEnded; }
  };

  function init() {
    $rootScope.$watchCollection(function () {
      return {
        space: spaceContext.space,
        user: dotty.get(authentication, 'tokenLookup.sys.createdBy')
      };
    }, trialWatcher);
  }

  function trialWatcher (args, prev) {
    var space = args.space;
    var user = args.user;
    var userId = dotty.get(args.user, 'sys.id');

    // Break if there's not enough data
    if (!space || !user) {
      return;
    }
    // Break if both user and space didn't change
    if (userId === previousUserId && args.space === prev.space) {
      return;
    }

    previousUserId = userId;
    hasTrialEnded  = false;

    var organization = space.data.organization;
    var userOwnsOrganization = isUserOrganizationOwner(user, organization);

    if (organizationHasTrialSubscription(organization)) {
      var trial = TrialInfo.create(organization);
      if (trial.hasEnded()) {
        hasTrialEnded = true;
        notify(trialHasEndedMsg(organization, userOwnsOrganization));
        showPaywall(user, trial);
      } else {
        notify(timeLeftInTrialMsg(trial.getHoursLeft(), organization, userOwnsOrganization));
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
        params.action = newUpgradeAction(organization, trackPlanUpgrade);
      }
      $rootScope.$broadcast('persistentNotification', params);

      function trackPlanUpgrade () {
        analytics.trackPersistentNotificationAction('Plan Upgrade');
      }
    }
  }

  function showPaywall (user, trial) {
    if (paywallIsOpen) {
      return;
    }
    var organization = trial.getOrganization();
    var userOwnsOrganization = isUserOrganizationOwner(user, organization);

    trackPaywall('Viewed Paywall');

    paywallIsOpen = true;
    modalDialog.open({
      title: 'Paywall', // For generic Modal Dialog tracking.
      template: 'paywall_dialog',
      scopeData: {
        offerToSetUpPayment: userOwnsOrganization,
        setUpPayment: newUpgradeAction(organization, trackPaywallPlanUpgrade),
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
        organizationName: organization.name
      });
    }
  }

  function newUpgradeAction(organization, trackingFn){
    var organizationId = organization.sys.id;
    return function upgradeAction() {
      trackingFn();
      TheAccountView.goToSubscription(organizationId);
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

  function timeLeftInTrialMsg (hours, organization, userIsOrganizationOwner) {
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

  function isUserOrganizationOwner (user, organization) {
    var organizationMembership =
      _.find(user.organizationMemberships, function (membership) {
        return membership.organization.sys.id === organization.sys.id;
      });
    return !!organizationMembership &&
      organizationMembership.role === 'owner';
  }
}]);

angular.module('contentful').factory('TrialInfo', ['$injector', function ($injector) {
  var moment = $injector.get('moment');

  return { create: create };

  function create (organization) {
    var endMoment = moment(organization.trialPeriodEndsAt);

    return {
      getHoursLeft: function () {
        return endMoment.diff(moment(), 'hours');
      },
      hasEnded: function () {
        return !endMoment.isAfter(moment());
      },
      getOrganization: function () {
        return organization;
      }
    };
  }
}]);
