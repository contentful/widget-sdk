'use strict';
angular.module('contentful').factory('enforcements', function Enforcements($injector, $location, $window) {

  var spaceContext, user;

  function setTokenObjects(newSpaceContext) {
    if(newSpaceContext) spaceContext = newSpaceContext;
    user = $injector.get('authentication').getUser();
  }

  function isOwner() {
    if(!user.sys) throw new Error('Bad user object');
    if(!spaceContext.space.data.sys) throw new Error('Bad space object');
    return user.sys.id === spaceContext.space.data.sys.createdBy.sys.id;
  }

  function getOrgId() {
    return spaceContext.space.getOrganizationId();
  }

  function upgradeActionMessage() {
    return isOwner() ?  'Upgrade': undefined;
  }

  function upgradeAction() {
    $location.path('/account/organizations/'+getOrgId()+'/subscription');
  }


  var errorsByPriority = [
    {
      label: 'systemMaintenance',
      message: 'System under maintenance',
      description: 'The service is down for maintenance and accessible in read-only mode.',
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
          'To be able to edit content within your Organization, please update your billing details.':
          'To be able to edit content within your Organization, the Organization Owner must update billing details.';
      },
      actionMessage: function () {
        return isOwner() ?  'Update': undefined;
      },
      action: function () {
        $location.path('/account/organizations/'+getOrgId()+'/subscription/billing');
      }
    },
    {
      label: 'periodUsageExceeded',
      message: 'Over usage limits',
      description: 'You have exceeded the monthly usage quota for your pricing plan. Please upgrade to ensure an uninterrupted delivery of your content.',
      tooltip: '',
      actionMessage: upgradeActionMessage,
      action: upgradeAction
    },
    {
      label: 'usageExceeded',
      message: 'Over usage limits',
      description: 'You have exceeded the usage limits for your plan. Please upgrade to proceed with content creation & delivery.',
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

  function uncapitalize(str) {
    return str[0].toLowerCase() + str.substr(1);
  }

  function getTooltipMessage(metricKey) {
    return 'You have exceeded your '+usageMetrics[uncapitalize(metricKey)]+' usage';
  }

  function computeUsage(filter) {
    assertSpaceContext();
    if(!spaceContext.space) return;
    if(filter) filter = uncapitalize(filter);
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
      getTooltipMessage(metricKey) :
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
    getTooltipMessage: getTooltipMessage,
    setSpaceContext: function (spaceContext) {
      setTokenObjects(spaceContext);
    }
  };
});
