import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TextLink, Note, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getVariation } from 'LaunchDarkly';
import { PRICING_2020_RELEASED } from 'featureFlags';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { websiteUrl } from 'Config';

import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { showDialog as showCreateSpaceModal } from 'services/CreateSpace';
import * as TokenStore from 'services/TokenStore';
import { isOwner } from 'services/OrganizationRoles';
import { Space as SpacePropType } from 'app/OrganizationSettings/PropTypes';
import { getBasePlan, isFreePlan, isSelfServicePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';

const styles = {
  wrapper: css({
    marginBottom: tokens.spacingM,
  }),
};

// This is correspondent to 90% of the limit of users for Tier Team
export const THRESHOLD_NUMBER_TO_DISPLAY_BANNER = 9;

export function UserLimitBanner({ orgId, spaces, usersCount }) {
  const spaceToUpgrade = spaces?.length > 0 ? spaces[0] : null;
  const [userIsOwner, setUserIsOwner] = useState(false);
  const [basePlan, setBasePlan] = useState(null);
  const [shouldShowCommunityBanner, setShouldShowCommunityBanner] = useState(false);
  const [shouldShowSelfServiceBanner, setShouldShowSelfServiceBanner] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      // If the organization is billable, they can add more than
      // just the free users so we don't need to tell them to upgrade
      const endpoint = createOrganizationEndpoint(orgId);
      const organization = await TokenStore.getOrganization(orgId);

      // If the base plan can't be fetched (for v1), we can just consider it
      // not free, since the community banner shouldn't show in this case
      // anyway.
      let basePlan = null;

      if (!isLegacyOrganization(organization)) {
        basePlan = await getBasePlan(endpoint);

        if (isFreePlan(basePlan)) {
          const variation = getVariation(PRICING_2020_RELEASED, { organizationId: orgId });
          setShouldShowCommunityBanner(variation);
        } else if (
          isSelfServicePlan(basePlan) &&
          usersCount >= THRESHOLD_NUMBER_TO_DISPLAY_BANNER
        ) {
          setShouldShowSelfServiceBanner(true);
        }
      }

      setBasePlan(basePlan);
      setUserIsOwner(isOwner(organization));
    };
    fetch();
  }, [usersCount, orgId]);

  const trackMeta = {
    organizationId: orgId,
    ...(spaceToUpgrade && { spaceId: spaceToUpgrade.sys.id }),
  };

  const changeSpace = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, trackMeta);

    showChangeSpaceModal({
      action: 'change',
      organizationId: orgId,
      ...(spaceToUpgrade && { space: spaceToUpgrade }),
    });
  };

  const createSpace = () => {
    trackTargetedCTAClick(CTA_EVENTS.CREATE_SPACE, trackMeta);
    showCreateSpaceModal(orgId);
  };

  const handleUpgradeToEnterpriseClick = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      organizationId: orgId,
    });
  };

  // Only want to show a banner if one of them should trigger.
  const shouldShowBanner = shouldShowCommunityBanner || shouldShowSelfServiceBanner;
  if (!basePlan || !shouldShowBanner) {
    return null;
  }

  return (
    <Note noteType="primary" className={styles.wrapper} testId="users-limit-banner">
      {shouldShowCommunityBanner && (
        <>
          <Paragraph>The free community plan has a limit of 5 users.</Paragraph>
          <Paragraph>
            To increase the limit,{' '}
            {userIsOwner ? (
              <TrackTargetedCTAImpression
                impressionType={
                  spaceToUpgrade ? CTA_EVENTS.UPGRADE_SPACE_PLAN : CTA_EVENTS.CREATE_SPACE
                }
                meta={trackMeta}>
                <TextLink
                  onClick={spaceToUpgrade ? changeSpace : createSpace}
                  testId="upgrade-space-plan">
                  {spaceToUpgrade ? 'upgrade your free space' : 'purchase a space'}
                </TextLink>
              </TrackTargetedCTAImpression>
            ) : (
              'the organization owner must upgrade your tier by purchasing or upgrading a space'
            )}
            .
          </Paragraph>
        </>
      )}

      {shouldShowSelfServiceBanner && (
        <>
          <Paragraph>
            Your organization has {usersCount} users. 10 users are included free on the Team tear
            with a maximum of 25 users.
          </Paragraph>
          <Paragraph>
            To increase the limit,{' '}
            {userIsOwner ? (
              <TrackTargetedCTAImpression
                impressionType={CTA_EVENTS.UPGRADE_TO_ENTERPRISE}
                meta={trackMeta}>
                <ExternalTextLink
                  testId="link-to-sales"
                  href={websiteUrl('contact/sales/')}
                  onClick={handleUpgradeToEnterpriseClick}>
                  talk to us
                </ExternalTextLink>{' '}
                about upgrading to enterprise
              </TrackTargetedCTAImpression>
            ) : (
              `the organization owner must upgrade your organization to enterprise`
            )}
            .
          </Paragraph>
        </>
      )}
    </Note>
  );
}

UserLimitBanner.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaces: PropTypes.arrayOf(SpacePropType),
  usersCount: PropTypes.number,
};

export default UserLimitBanner;
