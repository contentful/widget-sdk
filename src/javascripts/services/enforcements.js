'use strict';
angular.module('contentful').factory('enforcements', ['$injector', function Enforcements($injector) {

  var spaceContext, user;

  var $location   = $injector.get('$location');
  var $window     = $injector.get('$window');
  var stringUtils = $injector.get('stringUtils');
  var analytics   = $injector.get('analytics');

  function setTokenObjects(newSpaceContext) {
    if(newSpaceContext) spaceContext = newSpaceContext;
    user = $injector.get('authentication').getUser();
  }

  function isOwner() {
    if(!user.sys) throw new Error('Bad user object');
    if(!dotty.exists(spaceContext, 'space.data.sys')) throw new Error('Bad space object');
    return dotty.get(user, 'sys.id') === dotty.get(spaceContext, 'space.data.sys.createdBy.sys.id');
  }

  function getOrgId() {
    return spaceContext.space.getOrganizationId();
  }

  function upgradeActionMessage() {
    return isOwner() ?  'Upgrade': undefined;
  }

  function upgradeAction() {
    analytics.trackPersistentNotificationAction('Quota Increase');
    $location.path('/account/organizations/'+getOrgId()+'/subscription');
  }


  var errorsByPriority = [
    {
      label: 'systemMaintenance',
      message: '<strong>System under maintenance.</strong> The service is down for maintenance and accessible in read-only mode.',
      actionMessage: 'Status',
      action: function () {
        analytics.trackPersistentNotificationAction('Visit Status Page');
        $window.location = 'http://status.contentful.com';
      }
    },
    {
      label: 'subscriptionUnsettled',
      message: function () {
        return '<strong>Outstanding invoices.</strong> ' +
          (isOwner() ?
          'To be able to edit content within your Organization, please update your billing details.':
          'To be able to edit content within your Organization, the Organization Owner must update billing details.');
      },
      actionMessage: function () {
        return isOwner() ?  'Update': undefined;
      },
      action: function () {
        analytics.trackPersistentNotificationAction('Update Billing Details');
        $location.path('/account/organizations/'+getOrgId()+'/subscription/billing');
      }
    },
    {
      label: 'periodUsageExceeded',
      message: '<strong>Over usage limits.</strong> You have exceeded the monthly usage quota for your pricing plan. Please upgrade to ensure an uninterrupted delivery of your content.',
      actionMessage: upgradeActionMessage,
      action: upgradeAction
    },
    {
      label: 'usageExceeded',
      message: '<strong>Over usage limits.</strong> You have exceeded the usage limits for your plan. Please upgrade to proceed with content creation & delivery.',
      tooltip: getMetricMessage,
      actionMessage: upgradeActionMessage,
      action: upgradeAction
    },
    {
      label: 'accessTokenScope',
      message: 'An unknown error occurred',
    }
  ];

  var usageMetrics = {
    apiKey: 'API keys',
    asset: 'Assets',
    contentType: 'Content Types',
    entry: 'Entries',
    locale: 'Locales',
    spaceMembership: 'Space Memberships',
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

  function assertSpaceContext() {
    if(!spaceContext) throw new Error('No space context defined');
  }

  function getMetricMessage(metricKey) {
    return 'You have exceeded your '+usageMetrics[stringUtils.uncapitalize(metricKey)]+' usage';
  }

  function computeUsage(filter) {
    assertSpaceContext();
    if(!spaceContext.space) return;
    if(filter) filter = stringUtils.uncapitalize(filter);
    var organization = spaceContext.space.data.organization;
    var usage = _.merge(
      organization.usage.permanent,
      organization.usage.period);
    var limits = _.merge(
      organization.subscriptionPlan.limits.permanent,
      organization.subscriptionPlan.limits.period);

    var metricKey = _.findKey(usage, function (value, name) {
      return (!filter || filter === name) && value >= limits[name];
    });

    return metricKey ?
      getMetricMessage(metricKey) :
      undefined;
  }

  function determineEnforcement(reasons, entityType) {
    assertSpaceContext();
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
    setSpaceContext: function (spaceContext) {
      setTokenObjects(spaceContext);
    }
  };
}]);
