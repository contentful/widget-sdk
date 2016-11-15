'use strict';

angular.module('contentful')

.factory('analyticsEvents/persistentNotification', ['require', function (require) {
  var analytics = require('analytics');

  return {action: action};

  function action (name) {
    var currentPlan = analytics.getSessionData('organization.subscriptionPlan.name');

    analytics.track('Clicked Top Banner CTA Button', {
      action: name,
      currentPlan: currentPlan !== undefined ? currentPlan : null
    });
  }
}]);
