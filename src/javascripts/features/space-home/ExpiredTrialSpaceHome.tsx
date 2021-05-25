import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading, Paragraph, Typography, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/illustrations/expired-trial-space-home-ill.svg';
import { useAppsTrial, useTrialSpace } from 'features/trials';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { openDeleteSpaceDialog } from 'features/space-settings';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { getAddOnProductRatePlans } from 'features/pricing-entities';
import { router } from 'core/react-routing';

const styles = {
  buyButton: css({
    marginRight: tokens.spacingM,
  }),
};

export const ExpiredTrialSpaceHome = () => {
  const [composeAndLaunchProductPrice, setComposeAndLaunchProductPrice] = useState<number>(0);
  const {
    currentSpaceData,
    currentOrganizationId,
    currentOrganization,
    currentSpaceId,
  } = useSpaceEnvContext();
  const { appsTrialEndsAt, hasAppsTrialPurchased } = useAppsTrial(currentOrganizationId);
  const {
    matchesAppsTrialSpaceKey: isAppsTrialSpace,
    hasTrialSpaceExpired,
    hasTrialSpaceConverted,
    trialSpaceExpiresAt,
  } = useTrialSpace(currentOrganizationId, currentSpaceId);

  const isOrgOwnerOrAdmin = isOwnerOrAdmin(currentOrganization);
  const isExpiredSpace = hasTrialSpaceExpired && !hasTrialSpaceConverted;

  useEffect(() => {
    if (
      !currentOrganizationId ||
      !isExpiredSpace ||
      !isAppsTrialSpace ||
      !isOrgOwnerOrAdmin ||
      hasAppsTrialPurchased
    ) {
      return;
    }

    const fetchComposeAndLaunchProductPrice = async () => {
      const orgEndpoint = createOrganizationEndpoint(currentOrganizationId);
      const [addOnProductRatePlan] = await getAddOnProductRatePlans(orgEndpoint);
      setComposeAndLaunchProductPrice(addOnProductRatePlan?.price);
    };

    fetchComposeAndLaunchProductPrice();
  }, [
    currentOrganizationId,
    isExpiredSpace,
    isAppsTrialSpace,
    isOrgOwnerOrAdmin,
    hasAppsTrialPurchased,
  ]);

  if (currentSpaceData?.readOnlyAt || !isExpiredSpace) {
    return null;
  }

  const isEnterpriseTrialSpace = isExpiredSpace && !isAppsTrialSpace;
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
      space: currentSpaceData!,
      plan: undefined,
      onSuccess: () => {
        router.navigate(
          {
            path: 'organizations.subscription.overview',
            orgId: currentOrganizationId as string,
          },
          { reload: true }
        );
      },
    });
  };

  return (
    <EmptyStateContainer data-test-id="expired-trial-space-home">
      <Illustration className={defaultSVGStyle} />
      <Typography>
        <Heading>
          {isEnterpriseTrialSpace &&
            `Your trial space expired on ${moment(trialSpaceExpiresAt).format('D MMMM YYYY')}`}
          {isAppsTrialSpace &&
            `Your Contentful Apps trial space expired on ${moment(appsTrialEndsAt).format(
              'D MMMM YYYY'
            )}`}
        </Heading>
        <Paragraph>
          All of your content is saved, but you can’t create or edit anymore.
          <br />
          {isEnterpriseTrialSpace && 'Contact us to upgrade and unlock this space again.'}
          {showAppsTrialSpaceAdminActions &&
            (hasAppsTrialPurchased
              ? 'Upgrade now and unlock this space again.'
              : `Buy Compose + Launch for $${composeAndLaunchProductPrice}/month to continue using them across your spaces.`)}
          {isAppsTrialSpace &&
            !isOrgOwnerOrAdmin &&
            `Talk to your admin to ${
              hasAppsTrialPurchased ? 'upgrade' : 'buy the Contentful Apps'
            } now and unlock this space again.`}
        </Paragraph>
      </Typography>
      {showAppsTrialSpaceAdminActions && (
        <div>
          <TrackTargetedCTAImpression impressionType={CTA_EVENTS.DELETE_APP_TRIAL_SPACE}>
            <Button
              onClick={handlePurchase}
              testId="expired-trial-space-home.buy-now"
              className={styles.buyButton}>
              {hasAppsTrialPurchased ? 'Upgrade now' : 'Buy now'}
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
