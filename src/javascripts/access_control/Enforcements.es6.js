import $location from '$location';
import $window from '$window';
import {uncapitalize} from 'stringUtils';
import trackPersistentNotification from 'analyticsEvents/persistentNotification';
import spaceContext from 'spaceContext';
import * as OrganizationRoles from 'services/OrganizationRoles';
import {merge, findKey, clone, forEach, get} from 'lodash';

const errorsByPriority = [
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

const usageMetrics = {
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

const periodUsageMetrics = [
  'assetBandwidth',
  'contentDeliveryApiRequest'
];


export function computeUsage (filter) {
  return computeUsageForOrganization(spaceContext.organizationContext.organization, filter);
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

export function determineEnforcement (reasons, entityType) {
  if (!reasons || reasons.length && reasons.length === 0) return null;
  const errors = errorsByPriority.filter((val) => reasons.indexOf(val.label) >= 0);
  if (errors.length === 0) return null;

  const error = clone(errors[0]);

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
}

export function getPeriodUsage () {
  if (!isOwner() || isAdditionalUsageAllowed()) return;
  if (!periodUsageMetrics.find((metric) => computeUsage(metric))) return;

  return determineEnforcement('periodUsageExceeded');
}

function getMetricMessage (metricKey) {
  return 'You have exceeded your ' + usageMetrics[uncapitalize(metricKey)] + ' usage';
}

function isOwner () {
  const organization = spaceContext.organizationContext.organization;
  return OrganizationRoles.isOwner(organization);
}

function isAdditionalUsageAllowed () {
  return spaceContext.subscription.isAdditionalUsageAllowed();
}

function getOrgId () {
  return get(spaceContext, 'organizationContext.organization.sys.id');
}

function upgradeActionMessage (text) {
  return () => isOwner() ? text : undefined;
}

function upgradeAction () {
  trackPersistentNotification.action('Quota Increase');
  $location.path('/account/organizations/' + getOrgId() + '/z_subscription');
}
