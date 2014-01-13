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
    var subscription = space.data.subscription;

    if(subscription.state == 'trial'){
      hours = moment(subscription.trialPeriodEndsAt).diff(moment(), 'hours');
      if(hours/24 <= 1){
        timePeriod = {length: hours, unit: 'hours'};
      } else {
        timePeriod = {length: Math.floor(hours/24), unit: 'days'};
      }
      message = timeTpl('<strong>%length</strong> %unit left in trial', timePeriod);
      tooltipMessage = timeTpl('This Space is in trial mode and you can test all features for '+
                       '%length more %unit. Enter your billing information to activate your subscription.', timePeriod);

    } else if(subscription.state == 'active' &&
              !subscription.subscriptionPlan.paid &&
              subscription.subscriptionPlan.kind == 'default'){
      message = 'Limited free version';
      tooltipMessage = 'This Space is on our limited free plan. Upgrade your subscription to get access to all features.';
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
    $scope.goToProfile('subscription');
  }

  function timeTpl(str, timePeriod) {
    return str.
      replace(/%length/, timePeriod.length).
      replace(/%unit/, timePeriod.unit);
  }

});
