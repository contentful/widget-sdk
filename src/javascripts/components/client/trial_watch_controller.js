'use strict';

angular.module('contentful')

.controller('TrialWatchController', ['$scope', '$injector', function TrialWatchController($scope, $injector) {
  var $rootScope     = $injector.get('$rootScope');
  var analytics      = $injector.get('analytics');
  var logger         = $injector.get('logger');
  var TheAccountView = $injector.get('TheAccountView');
  var moment         = $injector.get('moment');

  $scope.$watchGroup(['user', 'spaceContext.space'], trialWatcher);

  function trialWatcher () {
    var user = $scope.user;
    var space = $scope.spaceContext.space;

    if (!space || !user) {
      return;
    }

    var organization = space.data.organization;
    var userOwnsOrganization = userIsOrganizationOwner(user, organization);

    if (organization.subscriptionState == 'trial') {
      var trial = new Trial(organization);
      if (trial.hasEnded()) {
        notify(trialHasEndedMsg(organization, userOwnsOrganization));
      } else {
        notify(timeLeftInTrialMsg(trial.getHoursLeft()));
      }
    }
    else if ( organization.subscriptionState == 'active' &&
              !organization.subscriptionPlan.paid &&
              organization.subscriptionPlan.kind == 'default'
    ) {
      notify(limitedFreeVersionMsg());
    }

    function notify (message) {
      var params = {message: message};
      if (userOwnsOrganization) {
        params.actionMessage = 'Upgrade';
        params.action = upgradeAction;
      }
      $rootScope.$broadcast('persistentNotification', params);
    }
  }

  function upgradeAction(){
    if (!$scope.spaceContext.space) {
      return;
    }

    var orgId;
    try {
      orgId = $scope.spaceContext.space.getOrganizationId();
    } catch(exp) {
      logger.logError('Trial watch controller organization upgrade exception', {
        data: {
          space: $scope.spaceContext.space,
          exp: exp
        }
      });
    }

    var pathSuffix = 'organizations/' +
      orgId +
      '/subscription';

    analytics.trackPersistentNotificationAction('Plan Upgrade');
    TheAccountView.goTo(pathSuffix, { reload: true });
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

  function timeLeftInTrialMsg (hours) {
    var timePeriod;
    if (hours / 24 <= 1) {
      timePeriod = {length: hours, unit: 'hours'};
    } else {
      timePeriod = {length: Math.floor(hours / 24), unit: 'days'};
    }
    return timeTpl('<strong>%length %unit left in trial.</strong>' +
      'Your current Organization is in trial mode giving you ' +
      'access to all features for %length more %unit. Enter your billing ' +
      'information to activate your subscription.', timePeriod);
  }

  function limitedFreeVersionMsg () {
    return '<strong>Limited free version.</strong> You are currently ' +
      'enjoying our limited Starter plan. To get access to all features, ' +
      'please upgrade to a paid subscription plan.';
  }

  function timeTpl(str, timePeriod) {
    return str.
      replace(/%length/, timePeriod.length).
      replace(/%unit/, timePeriod.unit);
  }

  function userIsOrganizationOwner (user, organization) {
    var organizationMembership =
      user.organizationMemberships.find(function (membership) {
        return membership.organization.sys.id === organization.sys.id;
      });
    return !!organizationMembership &&
      organizationMembership.role === 'owner';
  }

  /**
   * @constructor
   */
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