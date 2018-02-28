import $window from '$window';
import {uncapitalize} from 'stringUtils';
import trackPersistentNotification from 'analyticsEvents/persistentNotification';
import * as OrganizationRoles from 'services/OrganizationRoles';
import {go} from 'states/Navigator';
import {merge, findKey, forEach, get} from 'lodash';
import require from 'require';

const USAGE_METRICS = {
  apiKey: 'API keys',
  asset: 'Assets',
  contentType: 'Content Model',
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

const PERIOD_USAGE_METRICS = [
  'assetBandwidth',
  'contentDeliveryApiRequest'
];

export function determineEnforcement (organization, reasons, entityType) {
  if (!reasons || reasons.length && reasons.length === 0) return null;

  const errorsByPriority = [
    {
      label: 'systemMaintenance',
      message: '<strong>System under maintenance.</strong> The service is down for maintenance and accessible in read-only mode.',
      actionMessage: 'Status',
      action: () => {
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
      message: `<strong>Over usage limits.</strong> ${getMetricMessage(entityType)}. Please upgrade to proceed with content creation & delivery.`,
      tooltip: getMetricMessage,
      actionMessage: upgradeActionMessage('Upgrade'),
      action: upgradeAction
    },
    {
      label: 'accessTokenScope',
      message: 'An unknown error occurred'
    }
  ];

  const error = errorsByPriority.find(({label}) => reasons.indexOf(label) >= 0);
  if (!error) { return null; }

  if (typeof error.tooltip === 'function') {
    error.tooltip = entityType ? error.tooltip(entityType) : error.tooltip;
  }

  if (typeof error.tooltip !== 'string') {
    error.tooltip = error.message;
  }

  forEach(error, (value, key) => {
    if (typeof value === 'function' && key !== 'action') {
      error[key] = value();
    }
  });

  return error;

  function upgradeActionMessage (text) {
    return () => isOwner(organization) ? text : undefined;
  }

  function upgradeAction () {
    trackPersistentNotification.action('Quota Increase');
    // using require to avoid circular dependency :(
    const isLegacyOrganization = require('utils/ResourceUtils').isLegacyOrganization;
    const subscriptionState = isLegacyOrganization(organization)
      ? 'subscription'
      : 'subscription_new';

    go({
      path: ['account', 'organizations', subscriptionState],
      params: { orgId: organization.sys.id }
    });
  }
}

export function getPeriodUsage (organization) {
  if (!isOwner(organization) || isAdditionalUsageAllowed(organization)) return;
  if (!PERIOD_USAGE_METRICS.find((metric) => computeUsageForOrganization(organization, metric))) return;

  return determineEnforcement(organization, ['periodUsageExceeded']);
}

export function computeUsageForOrganization (organization, filter) {
  if (!organization) return;

  if (filter) filter = uncapitalize(filter);
  const usage = merge(
    organization.usage.permanent,
    organization.usage.period
  );
  const limits = merge(
    organization.subscriptionPlan.limits.permanent,
    organization.subscriptionPlan.limits.period
  );

  const metricKey = findKey(usage, (value, name) => (!filter || filter === name) && value >= limits[name]);

  return metricKey ? getMetricMessage(metricKey) : undefined;
}

function getMetricMessage (metricKey) {
  return `You have exceeded your ${USAGE_METRICS[uncapitalize(metricKey)]} usage`;
}

function isOwner (organization) {
  return OrganizationRoles.isOwner(organization);
}

function isAdditionalUsageAllowed (organization) {
  return get(organization, 'subscription.additional_usage_allowed');
}
