'use strict';

angular.module('contentful')

.controller('TrialWatchController', ['$scope', '$injector', function TrialWatchController($scope, $injector) {
  var $rootScope     = $injector.get('$rootScope');
  var analytics      = $injector.get('analytics');
  var logger         = $injector.get('logger');
  var TheAccountView = $injector.get('TheAccountView');
  var moment         = $injector.get('moment');

  $scope.$watch('user', trialWatcher);
  $scope.$watch('spaceContext.space', trialWatcher);

  function trialWatcher() {
    var user = $scope.user;
    var space = $scope.spaceContext.space;
    if(!user || !space) return;
    var organization = space.data.organization;
    var message, action, actionMessage;
    var organizationMembership =
      user.organizationMemberships.find(function (membership) {
        return membership.organization.sys.id === organization.sys.id;
      });
    var isOrganizationOwner =
      !!organizationMembership && organizationMembership.role === 'owner';

    if (organization.subscriptionState == 'trial') {
      var hoursLeft = moment(organization.trialPeriodEndsAt).diff(moment(), 'hours');
      if (hoursLeft === 0) {
        message = trialHasEndedMsg(organization, isOrganizationOwner);
      } else {
        message = timeLeftInTrialMsg(hoursLeft);
      }

    } else if(organization.subscriptionState == 'active' &&
              !organization.subscriptionPlan.paid &&
              organization.subscriptionPlan.kind == 'default'){
      message = '<strong>Limited free version.</strong> You are currently enjoying our limited Starter plan. To get access to all features, please upgrade to a paid subscription plan.';
    }


    if(message || action && actionMessage){
      if (isOrganizationOwner) {
        actionMessage = 'Upgrade';
        action = upgradeAction;
      }

      $rootScope.$broadcast('persistentNotification', {
        message: message,
        action: action,
        actionMessage: actionMessage
      });
    } else {
      $rootScope.$broadcast('persistentNotification', null);
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

  function trialHasEndedMsg ( organization, userIsOrganizationOwner ) {
    var message = '<strong>Your trial has ended.</strong> The ' +
      organization.name + ' organization is in read-only mode.';

    if (userIsOrganizationOwner ) {
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

  function timeTpl(str, timePeriod) {
    return str.
      replace(/%length/, timePeriod.length).
      replace(/%unit/, timePeriod.unit);
  }

}]);
