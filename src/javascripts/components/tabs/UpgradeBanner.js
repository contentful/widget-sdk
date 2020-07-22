import React, { useCallback } from 'react';
import { get } from 'lodash';
import { useAsync } from 'core/hooks';
import { css } from 'emotion';

import { getResourceLimits, isLegacyOrganization } from 'utils/ResourceUtils';
import { websiteUrl } from 'Config';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import { isEnterprisePlan, getBasePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import ExternalTextLink from 'app/common/ExternalTextLink';

import createResourceService from 'services/ResourceService';
import { Note, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import * as PricingService from 'services/PricingService';
import { getModule } from 'core/NgRegistry';

const WARNING_THRESHOLD = 0.9;

const styles = {
  banner: css({
    marginBottom: '12px',
  }),
};

const openUpgradeModal = (space, onSubmit) =>
  showUpgradeSpaceDialog({
    organizationId: space.organization.sys.id,
    space,
    onSubmit,
  });

const handleOnUpgradeClick = (space, updateResource) => {
  trackTargetedCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
    organizationId: space.organization.sys.id,
    spaceId: space.sys.id,
  });

  openUpgradeModal(space, updateResource);
};
const handleUpgradeToEnterpriseClick = (space) => {
  trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
    spaceId: space.sys.id,
    organizationId: space.organization.sys.id,
  });
};

export default function UpgradeBanner() {
  const spaceContext = getModule('spaceContext');
  const space = spaceContext.getSpace();

  const updateResource = useCallback(async () => {
    // We only want to make these fetches if the user is an owner or admin && the organization is v2+
    // && it's the master environment
    if (
      !isOwnerOrAdmin(space.organization) ||
      isLegacyOrganization(space.organization) ||
      !spaceContext.isMasterEnvironment
    ) {
      return null;
    }

    const endpoint = createOrganizationEndpoint(space.organization.sys.id);
    const basePlan = getBasePlan(endpoint);
    const basePlanIsEnterprise = isEnterprisePlan(basePlan);

    // We don't want to trigger this for enterprise users
    if (basePlanIsEnterprise) {
      return {
        basePlanIsEnterprise,
      };
    }

    const [resource, nextSpacePlan] = await Promise.all([
      createResourceService(space.sys.id).get('record'),
      PricingService.nextSpacePlanForResource(
        space.organization.sys.id,
        space.sys.id,
        PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD
      ),
    ]);

    const hasNextSpacePlan = !!nextSpacePlan;

    return { resource, hasNextSpacePlan, basePlanIsEnterprise };
  }, [space, spaceContext.isMasterEnvironment]);

  const { isLoading, error, data } = useAsync(updateResource);

  if (isLoading) {
    return <div data-test-id="upgrade-banner.is-loading"></div>;
  }

  // This is only rendered for non-enterprise customers
  if (error || data?.basePlanIsEnterprise) {
    return null;
  }

  const { resource, hasNextSpacePlan } = data;

  const usage = get(resource, 'usage');
  const limit = getResourceLimits(resource).maximum;

  const usagePercentage = usage / limit;
  const shouldRenderBanner = usagePercentage >= WARNING_THRESHOLD;

  if (!shouldRenderBanner) {
    return null;
  }

  return (
    <Note noteType="primary" testId="upgrade-banner.container" className={styles.banner}>
      <Paragraph testId="upgrade-banner.usage-text">
        You have used {usage} of {limit} records (total assets and entries).
      </Paragraph>
      <Paragraph testId="upgrade-banner.action-text">
        To increase your limit,{' '}
        <TrackTargetedCTAImpression
          impressionType={
            hasNextSpacePlan ? CTA_EVENTS.UPGRADE_SPACE_PLAN : CTA_EVENTS.UPGRADE_TO_ENTERPRISE
          }
          meta={{ spaceId: space.sys.id, organizationId: space.organization.sys.id }}>
          {hasNextSpacePlan ? (
            <TextLink
              testId="upgrade-banner.upgrade-space-link"
              onClick={() => handleOnUpgradeClick(space, updateResource)}>
              upgrade space
            </TextLink>
          ) : (
            <>
              <ExternalTextLink
                testId="upgrade-banner.upgrade-to-enterprise-link"
                href={websiteUrl('contact/sales/')}
                onClick={() => {
                  handleUpgradeToEnterpriseClick(space);
                }}>
                talk to us
              </ExternalTextLink>{' '}
              about upgrading to the enterprise tier
            </>
          )}
        </TrackTargetedCTAImpression>
        .
      </Paragraph>
    </Note>
  );
}
