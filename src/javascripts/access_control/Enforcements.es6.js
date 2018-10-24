import $window from '$window';
import { uncapitalize } from 'utils/StringUtils.es6';
import trackPersistentNotification from 'analyticsEvents/persistentNotification';
import * as OrganizationRoles from 'services/OrganizationRoles.es6';
import { go } from 'states/Navigator.es6';
import { merge, findKey, forEach } from 'lodash';
import require from 'require';
import { supportUrl } from 'Config.es6';

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

export function determineEnforcement(organization, reasons, entityType) {
  if (!reasons || (reasons.length && reasons.length === 0)) return null;

  const errorsByPriority = [
    {
      label: 'systemMaintenance',
      message:
        '<strong>System under maintenance.</strong> The service is down for maintenance and accessible in read-only mode.',
      actionMessage: 'Status',
      action: () => {
        trackPersistentNotification.action('Visit Status Page');
        $window.location = 'https://www.contentfulstatus.com';
      }
    },
    {
      label: 'periodUsageExceeded',
      message:
        '<strong>You have reached one of your limits.</strong> To check your current limits, go to your subscription page.',
      actionMessage: () => {
        if (OrganizationRoles.isOwner(organization)) {
          return 'Go to subscription';
        }
      },
      action: upgradeAction
    },
    {
      label: 'usageExceeded',
      tooltip: getMetricMessage
    },
    {
      label: 'accessTokenScope',
      message: 'An unknown error occurred'
    },
    {
      label: 'readOnlySpace',
      message: () => {
        if (OrganizationRoles.isOwnerOrAdmin(organization)) {
          return `This space is set to read-only. Contact us to continue work.`;
        } else {
          return 'This space is set to read-only. Contact your organization administrator to continue work.';
        }
      },
      icon: 'info',
      link: () => {
        const talkToUsHref = `${supportUrl}?read-only-poc=true`;

        if (OrganizationRoles.isOwnerOrAdmin(organization)) {
          return {
            text: 'Talk to us',
            href: talkToUsHref
          };
        }
      }
    }
  ];

  const error = errorsByPriority.find(({ label }) => reasons.indexOf(label) >= 0);

  if (!error) {
    return null;
  }

  if (typeof error.message === 'function') {
    error.message = error.message(entityType);
  }

  if (typeof error.tooltip === 'function') {
    error.tooltip = entityType ? error.tooltip(entityType) : error.tooltip;
  }

  if (typeof error.tooltip !== 'string') {
    error.tooltip = error.message;
  }

  if (typeof error.link === 'function') {
    error.link = error.link(entityType);
  }

  forEach(error, (value, key) => {
    if (typeof value === 'function' && key !== 'action') {
      error[key] = value();
    }
  });

  return error;

  function upgradeAction() {
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

export function computeUsageForOrganization(organization, filter) {
  if (!organization) return;

  if (filter) filter = uncapitalize(filter);
  const usage = merge(organization.usage.permanent, organization.usage.period);
  const limits = merge(
    organization.subscriptionPlan.limits.permanent,
    organization.subscriptionPlan.limits.period
  );

  const metricKey = findKey(
    usage,
    (value, name) => (!filter || filter === name) && value >= limits[name]
  );

  return metricKey ? getMetricMessage(metricKey) : undefined;
}

function getMetricMessage(metricKey) {
  return `You have reached your ${USAGE_METRICS[uncapitalize(metricKey)]} limit`;
}
