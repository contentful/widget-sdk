'use strict';

angular.module('contentful')

.controller('TrialWatchController', ['$scope', '$injector', function TrialWatchController($scope, $injector) {
  var $rootScope     = $injector.get('$rootScope');
  var intercom       = $injector.get('intercom');
  var analytics      = $injector.get('analytics');
  var TheAccountView = $injector.get('TheAccountView');
  var moment         = $injector.get('moment');
  var modalDialog    = $injector.get('modalDialog');

  $scope.$watchGroup([
    // TODO: Get rid of necessity to watch the user.
    // Watching the user is required for initial load, when spaceContenxt.space is
    // initialized but $scope.user might not be set yet.
    // Watching only .sys.id prevents from calls on periodic token updates where
    // the whole user object is being replaced.
    'user.sys.id',
    'spaceContext.space'
  ], trialWatcher);

  function trialWatcher () {
    var user = $scope.user;
    var space = $scope.spaceContext.space;

    if (!space || !user) {
      return;
    }

    var organization = space.data.organization;
    var userOwnsOrganization = userIsOrganizationOwner(user, organization);

    if (organizationHasTrialSubscription(organization)) {
      var trial = new Trial(organization);
      if (trial.hasEnded()) {
        notify(trialHasEndedMsg(organization, userOwnsOrganization));
        showPaywall(user, trial);
      } else {
        notify(timeLeftInTrialMsg(trial.getHoursLeft(), userOwnsOrganization));
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
        params.action = newUpgradeAction(organization);
      }
      $rootScope.$broadcast('persistentNotification', params);
    }
  }

  var paywallIsOpen = false;
  function showPaywall (user, trial) {
    if (paywallIsOpen) {
      return;
    }
    paywallIsOpen = true;
    modalDialog.open({
      template: 'paywall_dialog',
      scopeData: {
        offerToSetUpPayment: userIsOrganizationOwner(user, trial.organization),
        setUpPayment: newUpgradeAction(trial.organization),
        openIntercom: intercom.open
      }
    }).promise.finally(function () {
      paywallIsOpen = false;
    });
  }

  function newUpgradeAction(organization){
    var organizationId = organization.sys.id;
    return function upgradeAction() {
      analytics.trackPersistentNotificationAction('Plan Upgrade');
      TheAccountView.goToSubscription(organizationId);
    };
  }

  function trialHasEndedMsg (organization, userIsOrganizationOwner) {
    var message = '<strong>Your trial has ended.</strong> The ' +
      organization.name + ' organization is in read-only mode.';

    if (userIsOrganizationOwner) {
      message += ' To continue adding content and using the API please ' +
        'insert your billing information.';
    } else {
      message += ' To continue using it please contact the account owner.';
    }
    return message;
  }

  function timeLeftInTrialMsg (hours, userIsOrganizationOwner) {
    var timePeriod;
    if (hours / 24 <= 1) {
      timePeriod = {length: hours, unit: 'hours'};
    } else {
      timePeriod = {length: Math.floor(hours / 24), unit: 'days'};
    }

    var message = timeTpl('<strong>%length %unit left in trial.</strong> ' +
      'Your current Organization is in trial mode giving you ' +
      'access to all features for %length more %unit.', timePeriod);

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

  function userIsOrganizationOwner (user, organization) {
    var organizationMembership =
      _.find(user.organizationMemberships, function (membership) {
        return membership.organization.sys.id === organization.sys.id;
      });
    return !!organizationMembership &&
      organizationMembership.role === 'owner';
  }

  function Trial (organization) {
    this.organization = organization;
    this._endMoment = moment(this.organization.trialPeriodEndsAt);
  }
  Trial.prototype.getHoursLeft = function () {
    return this._endMoment.diff(moment(), 'hours');
  };
  Trial.prototype.hasEnded = function () {
    return !this._endMoment.isAfter(moment());
  };

}]);
