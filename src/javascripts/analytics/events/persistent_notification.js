'use strict';

angular.module('contentful')

.factory('analyticsEvents/persistentNotification', ['require', require => {
  var Analytics = require('analytics/Analytics');

  return {action: action};

  function action (name) {
    var currentPlan = Analytics.getSessionData('organization.subscriptionPlan.name');

    Analytics.track('notification:action_performed', {
      action: name,
      currentPlan: currentPlan !== undefined ? currentPlan : null
    });
  }
}]);
