import React, { useCallback } from 'react';
import { useAsync } from 'core/hooks';

import { css } from 'emotion';
import { Note, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import ExternalTextLink from 'app/common/ExternalTextLink';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import { CTA_EVENTS, trackTargetedCTAClick } from 'analytics/trackCTA';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getResourceLimits } from 'utils/ResourceUtils';
import * as PricingService from 'services/PricingService';

const styles = {
  banner: css({
    marginBottom: tokens.spacingL,
  }),
};

export const UpgradeBanner = () => {
  const { currentSpaceId, currentOrganization, currentOrganizationId, environmentResources } =
    useSpaceEnvContext();

  const updateResource = useCallback(async () => {
    const isOrgAdminOrOwner = isOwnerOrAdmin(currentOrganization);

    if (!isOrgAdminOrOwner) {
      return { showContentTypeLimitBanner: false };
    }

    const resource = await environmentResources.get('contentType');
    const usage = resource.usage;
    const limit = getResourceLimits(resource).maximum;

    const hasUsageWarning = usage / limit >= PricingService.WARNING_THRESHOLD;

    let nextSpacePlan;

    if (hasUsageWarning) {
      nextSpacePlan = await PricingService.nextSpacePlanForResource(
        currentOrganizationId as string,
        currentSpaceId as string,
        PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE
      );
    }

    const showContentTypeLimitBanner = hasUsageWarning && !nextSpacePlan;

    return {
      showContentTypeLimitBanner,
      usage,
      limit,
    };
  }, [currentOrganization, currentOrganizationId, currentSpaceId, environmentResources]);

  const { isLoading, data } = useAsync(updateResource);

  if (isLoading || !data?.showContentTypeLimitBanner) {
    return null;
  }

  const handleBannerClickCTA = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      spaceId: currentSpaceId,
      organizationId: currentOrganizationId,
    });
  };

  return (
    <Note noteType="primary" className={styles.banner} testId="content-type-limit-banner">
      <Paragraph>
        You’ve used {data?.usage} of {data?.limit} content types.
      </Paragraph>
      <Paragraph>
        To increase the limit,{' '}
        <TrackTargetedCTAImpression
          impressionType={CTA_EVENTS.UPGRADE_TO_ENTERPRISE}
          meta={{ spaceId: currentSpaceId, organizationId: currentOrganizationId }}>
          <ExternalTextLink
            testId="link-to-sales"
            href={CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM}
            onClick={handleBannerClickCTA}>
            talk to us
          </ExternalTextLink>{' '}
        </TrackTargetedCTAImpression>
        about upgrading to the enterprise tier.
      </Paragraph>
    </Note>
  );
};
