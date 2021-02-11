import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading, Paragraph, Typography, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/illustrations/expired-trial-space-home-ill.svg';
import { useAsync } from 'core/hooks';
import {
  createAppTrialRepo,
  isExpiredTrialSpace,
  AppTrialFeature,
  isExpiredAppTrial,
} from 'features/trials';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { beginSpaceCreation } from 'services/CreateSpace';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { go } from 'states/Navigator';

const styles = {
  deleteButton: css({
    marginRight: tokens.spacingM,
  }),
};

export const ExpiredTrialSpaceHome = () => {
  const initialValue = { sys: {} } as AppTrialFeature;
  const [appTrialFeature, setAppTrialFeature] = useState<AppTrialFeature>(initialValue);

  const { currentSpaceData, currentOrganizationId, currentOrganization } = useSpaceEnvContext();

  const fetchData = useCallback(async () => {
    const isAppTrialEnabled = await getVariation(FLAGS.APP_TRIAL, {
      organizationId: currentOrganizationId,
      spaceId: undefined,
      environmentId: undefined,
    });
    if (isAppTrialEnabled) {
      const orgEndpoint = createOrganizationEndpoint(currentOrganizationId);
      const appTrial = await createAppTrialRepo(orgEndpoint).getTrial('compose_app');
      setAppTrialFeature(appTrial);
    }
  }, [currentOrganizationId]);

  useAsync(fetchData);

  if (
    !currentOrganizationId ||
    !currentSpaceData ||
    currentSpaceData.readOnlyAt ||
    !isExpiredTrialSpace(currentSpaceData)
  ) {
    return null;
  }

  const isAppTrialSpace = isExpiredAppTrial(appTrialFeature);
  const isTrialSpace = isExpiredTrialSpace(currentSpaceData) && !isAppTrialSpace;

  if (!isAppTrialSpace && !isTrialSpace) {
    return null;
  }

  const isOrgOwnerOrAdmin = isOwnerOrAdmin(currentOrganization);

  const handlePurchase = () => {
    trackTargetedCTAClick(CTA_EVENTS.PURCHASE_APP_VIA_TRIAL);
    beginSpaceCreation(currentOrganizationId);
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
            `Your trial space expired on ${moment(currentSpaceData.trialPeriodEndsAt).format(
              'D MMMM YYYY'
            )}`}
          {isAppTrialSpace &&
            `Your Contentful Apps trial expired on ${moment(
              appTrialFeature.sys.trial?.endsAt
            ).format('D MMMM YYYY')}`}
        </Heading>
        <Paragraph>
          All of your content is saved, but you can’t create or edit anything.
          <br />
          {isTrialSpace && 'Contact us to upgrade and unlock this space again.'}
          {isAppTrialSpace &&
            isOrgOwnerOrAdmin &&
            'Buy the Contentful Apps now and unlock this space again.'}
          {isAppTrialSpace &&
            !isOrgOwnerOrAdmin &&
            'Talk to your admin to buy the Contentful Apps now and unlock this space again.'}
        </Paragraph>
      </Typography>
      {isAppTrialSpace && isOrgOwnerOrAdmin && (
        <div>
          <TrackTargetedCTAImpression impressionType={CTA_EVENTS.PURCHASE_APP_VIA_TRIAL}>
            <Button
              onClick={handleDelete}
              className={styles.deleteButton}
              buttonType="muted"
              testId="expired-trial-space-home.delete-space">
              Delete space
            </Button>
          </TrackTargetedCTAImpression>
          <TrackTargetedCTAImpression impressionType={CTA_EVENTS.DELETE_APP_TRIAL_SPACE}>
            <Button onClick={handlePurchase} testId="expired-trial-space-home.buy-now">
              Buy now
            </Button>
          </TrackTargetedCTAImpression>
        </div>
      )}
    </EmptyStateContainer>
  );
};
