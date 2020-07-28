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

const openUpgradeModal = (organization, space, onSubmit) =>
  showUpgradeSpaceDialog({
    organizationId: organization.sys.id,
    space,
    onSubmit,
  });

const handleOnUpgradeClick = (organization, space, updateResource) => {
  trackTargetedCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
    organizationId: organization.sys.id,
    spaceId: space.sys.id,
  });

  openUpgradeModal(organization, space, updateResource);
};
const handleUpgradeToEnterpriseClick = (organization, space) => {
  trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
    spaceId: space.sys.id,
    organizationId: organization.sys.id,
  });
};

export default function UpgradeBanner() {
  const spaceContext = getModule('spaceContext');
  const space = spaceContext.getSpace().data;
  const organization = spaceContext.getData('organization');
  const isMasterEnvironment = spaceContext.isMasterEnvironment();

  const updateResource = useCallback(async () => {
    // We only want to make these fetches if the user is an owner or admin && the organization is v2+
    // && it's the master environment
    if (
      !isOwnerOrAdmin(organization) ||
      isLegacyOrganization(organization) ||
      !isMasterEnvironment
    ) {
      return {
        shouldShow: false,
      };
    }

    const endpoint = createOrganizationEndpoint(organization.sys.id);
    const basePlan = getBasePlan(endpoint);
    const basePlanIsEnterprise = isEnterprisePlan(basePlan);

    // We don't want to trigger this for enterprise users
    if (basePlanIsEnterprise) {
      return {
        shouldShow: false,
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

    return { shouldShow: true, resource, hasNextSpacePlan, basePlanIsEnterprise };
  }, [space, organization, isMasterEnvironment]);

  const { isLoading, error, data } = useAsync(updateResource);

  if (isLoading) {
    return <div data-test-id="upgrade-banner.is-loading"></div>;
  }

  // This is only rendered for non-enterprise customers
  if (error || !data?.shouldShow) {
    return null;
  }

  const { resource, hasNextSpacePlan } = data;

  const usage = get(resource, 'usage');
  const limit = getResourceLimits(resource).maximum;

  const shouldRenderBanner = usage / limit >= WARNING_THRESHOLD;

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
          meta={{ spaceId: space.sys.id, organizationId: organization.sys.id }}>
          {hasNextSpacePlan ? (
            <TextLink
              testId="upgrade-banner.upgrade-space-link"
              onClick={() => handleOnUpgradeClick(organization, space, updateResource)}>
              upgrade space
            </TextLink>
          ) : (
            <>
              <ExternalTextLink
                testId="upgrade-banner.upgrade-to-enterprise-link"
                href={websiteUrl('contact/sales/')}
                onClick={() => {
                  handleUpgradeToEnterpriseClick(organization, space);
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
