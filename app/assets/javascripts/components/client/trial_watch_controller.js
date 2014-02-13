'use strict';

angular.module('contentful').controller('TrialWatchController', function TrialWatchController($scope, $rootScope) {
  $scope.$watch('user', trialWatcher);
  $scope.$watch('spaceContext.space', trialWatcher);

  function trialWatcher() {
    var user = $scope.user;
    var space = $scope.spaceContext.space;
    if(!user || !space) return;
    var hours = null;
    var timePeriod, message, tooltipMessage, action, actionMessage;
    var isSpaceOwner = space.isOwner(user);
    var organization = space.data.organization;

    if(organization.subscriptionState == 'trial'){
      hours = moment(organization.trialPeriodEndsAt).diff(moment(), 'hours');
      if(hours/24 <= 1){
        timePeriod = {length: hours, unit: 'hours'};
      } else {
        timePeriod = {length: Math.floor(hours/24), unit: 'days'};
      }
      message = timeTpl('<strong>%length</strong> %unit left in trial', timePeriod);
      tooltipMessage = timeTpl(
        'Your current Organization is in trial mode giving you access to all features for '+
        '%length more %unit. Enter your billing information to activate your subscription.', timePeriod);

    } else if(organization.subscriptionState == 'active' &&
              !organization.subscriptionPlan.paid &&
              organization.subscriptionPlan.kind == 'default'){
      message = 'Limited free version';
      tooltipMessage = 'You are currently enjoying our limited Starter plan. To get access to all features, please upgrade to a paid subscription plan.';
    }


    if(message || tooltipMessage || action && actionMessage){
      if(isSpaceOwner){
        actionMessage = 'Upgrade';
        action = upgradeAction;
      }

      $rootScope.$broadcast('persistentNotification', {
        message: message,
        tooltipMessage: tooltipMessage,
        action: action,
        actionMessage: actionMessage
      });
    } else {
      $rootScope.$broadcast('persistentNotification', null);
    }
  }

  function upgradeAction(){
    $scope.goToAccount(
      'organizations/'+
      $scope.spaceContext.space.getOrganizationId()+
      '/subscription');
  }

  function timeTpl(str, timePeriod) {
    return str.
      replace(/%length/, timePeriod.length).
      replace(/%unit/, timePeriod.unit);
  }

});
