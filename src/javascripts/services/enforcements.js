'use strict';

angular.module('contentful')
.factory('enforcements', ['require', function Enforcements (require) {
  var $location = require('$location');
  var $window = require('$window');
  var stringUtils = require('stringUtils');
  var trackPersistentNotification = require('analyticsEvents/persistentNotification');
  var spaceContext = require('spaceContext');
  var OrganizationRoles = require('services/OrganizationRoles');

  function isOwner () {
    var organization = spaceContext.organizationContext.organization;
    return OrganizationRoles.isOwner(organization);
  }

  function isAdditionalUsageAllowed () {
    return spaceContext.subscription.isAdditionalUsageAllowed();
  }

  function getOrgId () {
    return _.get(spaceContext, 'organizationContext.organization.sys.id');
  }

  function upgradeActionMessage (text) {
    return function () { return isOwner() ? text : undefined; };
  }

  function upgradeAction () {
    trackPersistentNotification.action('Quota Increase');
    $location.path('/account/organizations/' + getOrgId() + '/z_subscription');
  }


  var errorsByPriority = [
    {
      label: 'systemMaintenance',
      message: '<strong>System under maintenance.</strong> The service is down for maintenance and accessible in read-only mode.',
      actionMessage: 'Status',
      action: function () {
        trackPersistentNotification.action('Visit Status Page');
        $window.location = 'https://www.contentfulstatus.com';
      }
    },
    {
      label: 'periodUsageExceeded',
      message: '<strong>You have reached one of your limits.</strong> To check your current limits, go to your subscription page.',
      actionMessage: upgradeActionMessage('Go to subscription'),
      action: upgradeAction
    },
    {
      label: 'usageExceeded',
      message: '<strong>Over usage limits.</strong> You have exceeded the usage limits for your plan. Please upgrade to proceed with content creation & delivery.',
      tooltip: getMetricMessage,
      actionMessage: upgradeActionMessage('Upgrade'),
      action: upgradeAction
    },
    {
      label: 'accessTokenScope',
      message: 'An unknown error occurred'
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

  function getMetricMessage (metricKey) {
    return 'You have exceeded your ' + usageMetrics[stringUtils.uncapitalize(metricKey)] + ' usage';
  }

  function computeUsage (filter) {
    return computeUsageForOrganization(spaceContext.organizationContext.organization, filter);
  }

  function computeUsageForOrganization (organization, filter) {
    if (!organization) return;

    if (filter) filter = stringUtils.uncapitalize(filter);
    var usage = _.merge(
      organization.usage.permanent,
      organization.usage.period
    );
    var limits = _.merge(
      organization.subscriptionPlan.limits.permanent,
      organization.subscriptionPlan.limits.period
    );

    var metricKey = _.findKey(usage, function (value, name) {
      return (!filter || filter === name) && value >= limits[name];
    });

    return metricKey ? getMetricMessage(metricKey) : undefined;
  }

  function determineEnforcement (reasons, entityType) {
    if (!reasons || reasons.length && reasons.length === 0) return null;
    var errors = _.filter(errorsByPriority, function (val) {
      return reasons.indexOf(val.label) >= 0;
    });
    if (errors.length === 0) return null;

    var error = _.clone(errors[0]);

    if (typeof error.tooltip === 'function') {
      error.tooltip = entityType ? error.tooltip(entityType) : error.tooltip;
    }

    if (typeof error.tooltip !== 'string') {
      error.tooltip = error.message;
    }

    _.forEach(error, function (value, key) {
      if (typeof value === 'function' && key !== 'action') {
        error[key] = value();
      }
    });

    return error;
  }

  function getPeriodUsage () {
    if (!isOwner() || isAdditionalUsageAllowed()) return;

    var enforcement;
    _.forEach(periodUsageMetrics, function (metric) {
      if (computeUsage(metric)) {
        enforcement = determineEnforcement('periodUsageExceeded');
        return false;
      }
    });
    return enforcement;
  }

  return {
    determineEnforcement: determineEnforcement,
    computeUsage: computeUsage,
    computeUsageForOrganization: computeUsageForOrganization,
    getPeriodUsage: getPeriodUsage
  };
}]);
