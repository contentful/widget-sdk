'use strict';

angular.module('contentful')

.controller('TrialWatchController', ['$scope', '$injector', function TrialWatchController($scope, $injector) {
  var $rootScope     = $injector.get('$rootScope');
  var analytics      = $injector.get('analytics');
  var logger         = $injector.get('logger');
  var TheAccountView = $injector.get('TheAccountView');

  $scope.$watch('user', trialWatcher);
  $scope.$watch('spaceContext.space', trialWatcher);

  function trialWatcher() {
    var user = $scope.user;
    var space = $scope.spaceContext.space;
    if(!user || !space) return;
    var hours = null;
    var timePeriod, message, action, actionMessage;
    var isSpaceOwner;
    try {
      isSpaceOwner = space.isOwner(user);
    } catch(exp){
      logger.logError('Trial watch controller organization exception', {
        data: {
          space: space,
          exp: exp
        }
      });
    }
    var organization = space.data.organization;

    if(organization.subscriptionState == 'trial'){
      hours = moment(organization.trialPeriodEndsAt).diff(moment(), 'hours');
      if(hours/24 <= 1){
        timePeriod = {length: hours, unit: 'hours'};
      } else {
        timePeriod = {length: Math.floor(hours/24), unit: 'days'};
      }
      message = timeTpl('<strong>%length</strong> %unit left in trial', timePeriod) + '. '+
                timeTpl('Your current Organization is in trial mode giving you access to all features for '+
                  '%length more %unit. Enter your billing information to activate your subscription.', timePeriod);

    } else if(organization.subscriptionState == 'active' &&
              !organization.subscriptionPlan.paid &&
              organization.subscriptionPlan.kind == 'default'){
      message = '<strong>Limited free version.</strong> You are currently enjoying our limited Starter plan. To get access to all features, please upgrade to a paid subscription plan.';
    }


    if(message || action && actionMessage){
      if(isSpaceOwner){
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

  function timeTpl(str, timePeriod) {
    return str.
      replace(/%length/, timePeriod.length).
      replace(/%unit/, timePeriod.unit);
  }

}]);
