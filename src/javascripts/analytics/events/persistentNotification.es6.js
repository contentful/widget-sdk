'use strict';

angular
  .module('contentful')

  .factory('analyticsEvents/persistentNotification', [
    'require',
    require => {
      const Analytics = require('analytics/Analytics.es6');

      return { action: action };

      function action(name) {
        const currentPlan = Analytics.getSessionData('organization.subscriptionPlan.name');

        Analytics.track('notification:action_performed', {
          action: name,
          currentPlan: currentPlan !== undefined ? currentPlan : null
        });
      }
    }
  ]);
