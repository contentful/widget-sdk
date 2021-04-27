import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading, Paragraph, Typography, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/illustrations/expired-trial-space-home-ill.svg';
import { useAppsTrial, isExpiredTrialSpace } from 'features/trials';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { openDeleteSpaceDialog } from 'features/space-settings';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { go } from 'states/Navigator';
import { getAddOnProductRatePlans } from 'features/pricing-entities';

const styles = {
  buyButton: css({
    marginRight: tokens.spacingM,
  }),
};

export const ExpiredTrialSpaceHome = () => {
  const [composeAndLaunchProductPrice, setComposeAndLaunchProductPrice] = useState<number>(0);
  const { currentSpaceData, currentOrganizationId, currentOrganization } = useSpaceEnvContext();
  const { appsTrialEndsAt, appsTrialSpaceKey } = useAppsTrial(currentOrganizationId);

  const isOrgOwnerOrAdmin = isOwnerOrAdmin(currentOrganization);
  const isExpiredSpace = isExpiredTrialSpace(currentSpaceData);
  const isAppsTrialSpace = currentSpaceData?.sys.id === appsTrialSpaceKey;

  useEffect(() => {
    if (!currentOrganizationId || !isExpiredSpace) {
      return;
    }

    const fetchData = async () => {
      if (isOrgOwnerOrAdmin && isAppsTrialSpace) {
        const orgEndpoint = createOrganizationEndpoint(currentOrganizationId);
        const addOnProductRatePlans = await getAddOnProductRatePlans(orgEndpoint);
        setComposeAndLaunchProductPrice(addOnProductRatePlans[0].price);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (currentSpaceData?.readOnlyAt || !isExpiredSpace) {
    return null;
  }

  const isTrialSpace = isExpiredSpace && !isAppsTrialSpace;
  const showAppsTrialSpaceAdminActions = isAppsTrialSpace && isOrgOwnerOrAdmin;

  const handlePurchase = () => {
    trackTargetedCTAClick(CTA_EVENTS.PURCHASE_APP_VIA_TRIAL);
    beginSpaceChange({
      organizationId: currentOrganizationId,
      space: currentSpaceData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  const handleDelete = () => {
    trackTargetedCTAClick(CTA_EVENTS.DELETE_APP_TRIAL_SPACE);
    openDeleteSpaceDialog({
      space: currentSpaceData,
      plan: undefined,
      onSuccess: () => {
        go({
          path: ['account', 'organizations', 'subscription_new'],
          params: { orgId: currentOrganizationId },
          options: { reload: true },
        });
      },
    });
  };

  return (
    <EmptyStateContainer data-test-id="expired-trial-space-home">
      <Illustration className={defaultSVGStyle} />
      <Typography>
        <Heading>
          {isTrialSpace &&
            `Your trial space expired on ${moment(currentSpaceData?.trialPeriodEndsAt).format(
              'D MMMM YYYY'
            )}`}
          {isAppsTrialSpace &&
            `Your Contentful Apps trial expired on ${moment(appsTrialEndsAt).format(
              'D MMMM YYYY'
            )}`}
        </Heading>
        <Paragraph>
          All of your content is saved, but you can’t create or edit anymore.
          <br />
          {isTrialSpace && 'Contact us to upgrade and unlock this space again.'}
          {isAppsTrialSpace &&
            isOrgOwnerOrAdmin &&
            `Buy Compose + Launch for $${composeAndLaunchProductPrice}/month to continue using them across your spaces.`}
          {isAppsTrialSpace &&
            !isOrgOwnerOrAdmin &&
            'Talk to your admin to buy the Contentful Apps now and unlock this space again.'}
        </Paragraph>
      </Typography>
      {showAppsTrialSpaceAdminActions && (
        <div>
          <TrackTargetedCTAImpression impressionType={CTA_EVENTS.DELETE_APP_TRIAL_SPACE}>
            <Button
              onClick={handlePurchase}
              testId="expired-trial-space-home.buy-now"
              className={styles.buyButton}>
              Buy now
            </Button>
          </TrackTargetedCTAImpression>
          <TrackTargetedCTAImpression impressionType={CTA_EVENTS.PURCHASE_APP_VIA_TRIAL}>
            <Button
              onClick={handleDelete}
              buttonType="muted"
              testId="expired-trial-space-home.delete-space">
              Delete space
            </Button>
          </TrackTargetedCTAImpression>
        </div>
      )}
    </EmptyStateContainer>
  );
};
