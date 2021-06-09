import React, { useCallback } from 'react';
import { get } from 'lodash';
import { useAsync } from 'core/hooks';
import { css } from 'emotion';

import { getResourceLimits } from 'utils/ResourceUtils';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { getBasePlan } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import ExternalTextLink from 'app/common/ExternalTextLink';

import createResourceService from 'services/ResourceService';
import { Note, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import * as PricingService from 'services/PricingService';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

const WARNING_THRESHOLD = 0.9;

const styles = {
  banner: css({
    marginBottom: '12px',
  }),
};

const openUpgradeModal = (organizationId, spaceData, onSubmit) =>
  beginSpaceChange({
    organizationId,
    space: spaceData,
    onSubmit,
  });

const handleOnUpgradeClick = (organizationId, spaceId, updateResource, spaceData) => {
  trackTargetedCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
    organizationId,
    spaceId,
  });

  openUpgradeModal(organizationId, spaceData, updateResource);
};
const handleUpgradeToEnterpriseClick = (organizationId, spaceId) => {
  trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
    spaceId,
    organizationId,
  });
};

export function UpgradeBanner() {
  const {
    currentSpaceData,
    currentSpaceId,
    currentOrganization,
    currentSpace,
    currentOrganizationId,
  } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  const updateResource = useCallback(async () => {
    // We only want to make these fetches if the user is an owner or admin
    // && it's the master environment
    if (!isOwnerOrAdmin(currentOrganization) || !isMasterEnvironment) {
      return {
        shouldShow: false,
      };
    }

    const endpoint = createOrganizationEndpoint(currentOrganizationId);
    const basePlan = await getBasePlan(endpoint);
    const basePlanIsEnterprise = isEnterprisePlan(basePlan);

    // We don't want to trigger this for enterprise users
    if (basePlanIsEnterprise) {
      return {
        shouldShow: false,
      };
    }

    const [resource, nextSpacePlan] = await Promise.all([
      createResourceService(currentSpaceId).get('record'),
      PricingService.nextSpacePlanForResource(
        currentOrganizationId,
        currentSpaceId,
        PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD
      ),
    ]);

    const hasNextSpacePlan = !!nextSpacePlan;

    return { shouldShow: true, resource, hasNextSpacePlan, basePlanIsEnterprise };
  }, [currentSpaceId, currentOrganizationId, isMasterEnvironment, currentOrganization]);

  const { isLoading, error, data } = useAsync(updateResource);

  if (isLoading) {
    return <div data-test-id="upgrade-banner.is-loading" />;
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
          meta={{ spaceId: currentSpaceId, organizationId: currentOrganizationId }}>
          {hasNextSpacePlan ? (
            <TextLink
              testId="upgrade-banner.upgrade-space-link"
              onClick={() =>
                handleOnUpgradeClick(
                  currentOrganizationId,
                  currentSpaceId,
                  updateResource,
                  currentSpaceData
                )
              }>
              upgrade space
            </TextLink>
          ) : (
            <>
              <ExternalTextLink
                testId="upgrade-banner.upgrade-to-enterprise-link"
                href={CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM}
                onClick={() => {
                  handleUpgradeToEnterpriseClick(currentOrganizationId, currentSpaceId);
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
