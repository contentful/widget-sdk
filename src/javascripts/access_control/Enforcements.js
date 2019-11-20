import { uncapitalize } from 'utils/StringUtils';
import * as OrganizationRoles from 'services/OrganizationRoles';
import { go } from 'states/Navigator';
import { get, forEach } from 'lodash';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { supportUrl } from 'Config';
import * as Analytics from 'analytics/Analytics';

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

const trackAction = action =>
  Analytics.track('notification:action_performed', {
    action,
    currentPlan: Analytics.getSessionData('organization.subscriptionPlan.name') || null
  });

export function determineEnforcement(space, reasons, entityType) {
  if (!reasons || (reasons.length && reasons.length === 0)) return null;

  const organization = get(space, 'organization');
  const errorsByPriority = [
    {
      label: 'systemMaintenance',
      message:
        '<strong>System under maintenance.</strong> The service is down for maintenance and accessible in read-only mode.',
      actionMessage: 'Status',
      action: () => {
        trackAction('Visit Status Page');

        window.location = 'https://www.contentfulstatus.com';
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
        const baseMessage =
          'You’re viewing a read-only space. All of your existing content is saved, but you canʼt create or edit anything. ';
        if (OrganizationRoles.isOwnerOrAdmin(organization)) {
          return `${baseMessage}Get in touch with us to continue work.`;
        } else {
          return `${baseMessage}Weʼve informed your Contentful admin about it.`;
        }
      },
      icon: 'info',
      link: () => {
        const spaceId = space.sys.id;
        const spaceName = space.name;
        const talkToUsHref = `${supportUrl}?read-only-space=true&space-id=${spaceId}&space-name=${spaceName}`;

        if (OrganizationRoles.isOwnerOrAdmin(organization)) {
          return {
            text: 'Talk to support',
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
    trackAction('Quota Increase');
    const subscriptionState = isLegacyOrganization(organization)
      ? 'subscription'
      : 'subscription_new';

    go({
      path: ['account', 'organizations', subscriptionState],
      params: { orgId: organization.sys.id }
    });
  }
}

function getMetricMessage(metricKey) {
  return `You have reached your ${USAGE_METRICS[uncapitalize(metricKey)]} limit`;
}
