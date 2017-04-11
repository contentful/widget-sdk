'use strict';

angular.module('contentful')
.factory('enforcements', ['require', function Enforcements (require) {
  var $location = require('$location');
  var $window = require('$window');
  var stringUtils = require('stringUtils');
  var trackPersistentNotification = require('analyticsEvents/persistentNotification');
  var logger = require('logger');
  var spaceContext = require('spaceContext');
  var OrganizationList = require('OrganizationList');

  function isOwner () {
    var organization = spaceContext.organizationContext.organization;
    return OrganizationList.isOwner(organization);
  }

  function getOrgId () {
    try {
      return spaceContext.space.getOrganizationId();
    } catch (exp) {
      logger.logError('enforcements organization exception', {
        data: {
          space: spaceContext.space,
          exp: exp
        }
      });
    }
  }

  function upgradeActionMessage () {
    return isOwner() ? 'Upgrade' : undefined;
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
      label: 'subscriptionUnsettled',
      message: function () {
        return '<strong>Outstanding invoices.</strong> ' + (
          isOwner()
            ? 'To be able to edit content within your Organization, please update your billing details.'
            : 'To be able to edit content within your Organization, the Organization Owner must update billing details.'
        );
      },
      actionMessage: function () {
        return isOwner() ? 'Update' : undefined;
      },
      action: function () {
        trackPersistentNotification.action('Update Billing Details');
        $location.path('/account/organizations/' + getOrgId() + '/subscription/billing');
      }
    },
    {
      label: 'periodUsageExceeded',
      message: '<strong>You have reached one of your limits.</strong> To check your current limits, go to your subscription page. If you have overages enabled, don’t worry - we’ll charge you as you go.',
      actionMessage: 'Go to subscription',
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
    if (!spaceContext.space) return;
    if (filter) filter = stringUtils.uncapitalize(filter);
    var organization = spaceContext.space.data.organization;
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
    if (!isOwner()) return;

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
    getPeriodUsage: getPeriodUsage
  };
}]);
