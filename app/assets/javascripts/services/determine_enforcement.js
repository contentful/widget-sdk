'use strict';
angular.module('contentful').factory('determineEnforcement', function DetermineEnforcement($injector, $location, $window, authorization) {

  var spaceContext, user;

  var setTokenObjects = function() {
    spaceContext = authorization.spaceContext;
    user = $injector.get('authentication').getUser();
  };

  function isOwner() {
    return user.sys.id === spaceContext.space.sys.createdBy.sys.id;
  }

  function upgradeActionMessage() {
    return isOwner() ?  'Upgrade': undefined;
  }

  function upgradeAction() {
    $location.path('/profile/subscription');
  }


  var errorsByPriority = [
    {
      label: 'systemMaintenance',
      message: 'System under maintenance',
      description: 'The system is currently under maintenance and in read-only mode.',
      actionMessage: 'Status',
      action: function () {
        $window.location = 'http://status.contentful.com';
      }
    },
    {
      label: 'subscriptionUnsettled',
      message: 'Outstanding invoices',
      description: function () {
        return isOwner() ?
          'Please provide updated billing details to be able to edit the content in this Space again.':
          'The owner of the Space needs to provide updated billing details to be able to edit the content in this Space again.';
      },
      actionMessage: function () {
        return isOwner() ?  'Update': undefined;
      },
      action: function () {
        $location.path('/profile/subscription/billing');
      }
    },
    {
      label: 'periodUsageExceeded',
      message: 'Over usage limits',
      description: 'This Space exceeds the monthly usage quota for the current subscription plan. Please upgrade to a higher plan to guarantee that your content is served without any interruptions.',
      tooltip: '',
      actionMessage: upgradeActionMessage,
      action: upgradeAction
    },
    {
      label: 'usageExceeded',
      message: 'Over usage limits',
      description: 'This Space exceeds the usage quota for the current subscription plan. Please upgrade to a higher plan.',
      tooltip: computeUsage,
      actionMessage: upgradeActionMessage,
      action: upgradeAction
    },
    {
      label: 'accessTokenScope',
      message: 'Unknown error occurred',
      description: ''
    }
  ];

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
    webhookDefinition: 'Webhook Definitions',
    assetBandwidth: 'Asset Bandwidth',
    contentDeliveryApiRequest: 'Content Delivery API Requests'
  };

  var periodUsageMetrics = [
    'assetBandwidth',
    'contentDeliveryApiRequest'
  ];

  function computeUsage(filter) {
    setTokenObjects();
    if(filter) filter[0] = filter[0].toLowerCase();
    var subscription = spaceContext.space.subscription;
    var usage = _.merge(
      subscription.usage.permanent,
      subscription.usage.period);
    var limits = _.merge(
      subscription.subscriptionPlan.limits.permanent,
      subscription.subscriptionPlan.limits.period);

    var metricName = usageMetrics[_.findKey(usage, function (value, name) {
      return (!filter || filter === name) && value >= limits[name];
    })];

    return metricName ?
      'You have exceeded your '+metricName+' usage' :
      undefined;
  }

  function determineEnforcement(reasons, usageTypeFilter) {
    setTokenObjects();
    if(!reasons || reasons.length && reasons.length === 0) return null;
    var errors = _.filter(errorsByPriority, function (val) {
      return reasons.indexOf(val.label) >= 0;
    });
    if(errors.length === 0) return null;

    var error = _.clone(errors[0]);

    if(error.tooltip === undefined){
      error.tooltip = error.message;
    }

    if(typeof error.tooltip == 'function'){
      error.tooltip = error.tooltip(usageTypeFilter) || error.message;
    }
    _.forEach(error, function (value, key) {
      if(typeof value == 'function' && key != 'action'){
        error[key] = value();
      }
    });

    return error;
  }

  function getPeriodUsage() {
    var enforcement;
    _.forEach(periodUsageMetrics, function (metric) {
      if(computeUsage(metric)){
        enforcement = determineEnforcement('periodUsageExceeded', metric);
        return false;
      }
    });
    return enforcement;
  }

  return {
    determineEnforcement: determineEnforcement,
    computeUsage: computeUsage,
    getPeriodUsage: getPeriodUsage
  };
});
