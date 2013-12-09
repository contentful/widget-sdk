'use strict';
angular.module('contentful').factory('enforcements', function Enforcements($injector, $location, $window, authorization) {

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
      tooltip: getTooltipMessage,
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

  function uncapitalize(str) {
    return str[0].toLowerCase() + str.substr(1);
  }

  function getTooltipMessage(metricKey) {
    return 'You have exceeded your '+usageMetrics[uncapitalize(metricKey)]+' usage';
  }

  function computeUsage(filter) {
    setTokenObjects();
    if(filter) filter = uncapitalize(filter);
    var subscription = spaceContext.space.subscription;
    var usage = _.merge(
      subscription.usage.permanent,
      subscription.usage.period);
    var limits = _.merge(
      subscription.subscriptionPlan.limits.permanent,
      subscription.subscriptionPlan.limits.period);

    var metricKey = _.findKey(usage, function (value, name) {
      return (!filter || filter === name) && value >= limits[name];
    });

    return metricKey ?
      getTooltipMessage(metricKey) :
      undefined;
  }

  function determineEnforcement(reasons, entityType) {
    setTokenObjects();
    if(!reasons || reasons.length && reasons.length === 0) return null;
    var errors = _.filter(errorsByPriority, function (val) {
      return reasons.indexOf(val.label) >= 0;
    });
    if(errors.length === 0) return null;

    var error = _.clone(errors[0]);

    if(typeof error.tooltip == 'function'){
      error.tooltip = entityType ? error.tooltip(entityType) : error.tooltip;
    }

    if(typeof error.tooltip !== 'string'){
      error.tooltip = error.message;
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
        enforcement = determineEnforcement('periodUsageExceeded');
        return false;
      }
    });
    return enforcement;
  }

  return {
    determineEnforcement: determineEnforcement,
    computeUsage: computeUsage,
    getPeriodUsage: getPeriodUsage,
    getTooltipMessage: getTooltipMessage
  };
});
