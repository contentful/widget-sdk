'use strict';
angular.module('contentful').factory('determineEnforcement', function DetermineEnforcement($injector) {

  var errors = {
    system_maintenance: {
      message: 'System under maintenance',
      description: 'The system is currently under maintenance and in read-only mode.'
    },
    subscription_unsettled: {
      message: 'Outstanding invoices',
      description: 'Please provide updated billing details to be able to edit the content in this Space again.'
    },
    period_usage_exceeded: {
      message: 'Over usage limits',
      description: 'This Space exceeds the monthly usage quota for the current subscription plan. Please upgrade to a higher plan to guarantee that your content is served without any interruptions.',
      tooltip: ''
    },
    usage_exceeded: {
      message: 'Over usage limits',
      description: 'This Space exceeds the usage quota for the current subscription plan. Please upgrade to a higher plan.',
      tooltip: computeUsage,
    },
    access_token_scope: {
      message: 'Unknown error occurred',
      description: ''
    }
  };

  var usageMetrics = {
    apiKey: 'API keys',
    asset: 'Assets',
    contentType: 'Content Types',
    entry: 'Entries',
    locale: 'Locales',
    membership: 'Memberships',
    role: 'Roles',
    space: 'Spaces',
    user: 'Users',
    webhookDefinition: 'Webhook Definitions'
  };

  function computeUsage() {
    var user = $injector.get('authentication').getUser();
    var usage = user.subscription.usage.permanent;
    var limits = user.subscription.subscriptionPlan.limits.permanent;

    var metricName = usageMetrics[_.findKey(usage, function (value, name) {
      return value >= limits[name];
    })];

    return metricName ?
      'You have exceeded your '+metricName+' usage' :
      undefined;
  }

  return function (reason) {
    if(!(reason in errors)) return null;

    var error = _.clone(errors[reason]);
    if(error.tooltip === undefined){
      error.tooltip = error.message;
    }

    if(typeof error.tooltip == 'function'){
      error.tooltip = error.tooltip() || error.message;
    }

    return error;
  };
});
