import React, { useState, useCallback } from 'react';
import { css } from 'emotion';
import { Tag, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { Pluralized } from 'core/components/formatting';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import StateLink from 'app/common/StateLink';
import { useAsync } from 'core/hooks';
import { initTrialProductTour } from '../services/intercomProductTour';
import { calcTrialDaysLeft } from '../utils';
import { getModule } from 'core/NgRegistry';
import { getOrganization, getSpace } from 'services/TokenStore';
import { isOrganizationOnTrial, isSpaceOnTrial } from '../services/TrialService';

const styles = {
  tag: css({
    background: tokens.colorPrimary,
    margin: 'auto',
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    borderRadius: tokens.spacing2Xs,
  }),
  link: css({
    ':link': {
      whiteSpace: 'pre',
    },
  }),
};

export const TrialTag = () => {
  const [organization, setOrganization] = useState();
  const [space, setSpace] = useState();

  const [isPlatformTrialCommEnabled, setIsPlatformTrialCommEnabled] = useState(false);

  const { orgId, spaceId } = getModule('$stateParams');

  const fetchData = useCallback(async () => {
    const isPlatformTrialCommEnabled = await getVariation(FLAGS.PLATFORM_TRIAL_COMM, {
      organizationId: orgId,
      spaceId,
    });
    setIsPlatformTrialCommEnabled(isPlatformTrialCommEnabled);

    if (!isPlatformTrialCommEnabled) {
      return;
    }

    let org;
    let space;

    if (orgId) {
      org = await getOrganization(orgId);
    }

    if (spaceId) {
      space = await getSpace(spaceId);
      org = space.organization;
    }

    if (isPlatformTrialCommEnabled && isOrganizationOnTrial(org)) {
      initTrialProductTour();
    }

    setOrganization(org);
    setSpace(space);
  }, [spaceId, orgId]);

  const { isLoading } = useAsync(fetchData);

  const isEnterpriseTrial = organization && isOrganizationOnTrial(organization);
  const isSpaceTrial = space && isSpaceOnTrial(space);

  if (isLoading || !isPlatformTrialCommEnabled || (!isEnterpriseTrial && !isSpaceTrial)) {
    return null;
  }

  const daysLeft = isEnterpriseTrial
    ? calcTrialDaysLeft(organization.trialPeriodEndsAt)
    : calcTrialDaysLeft(space.trialPeriodEndsAt);

  const trialType = isEnterpriseTrial ? 'platform' : 'space';

  const tracking = {
    trackingEvent: 'trial:trial_tag_clicked',
    trackParams: {
      type: trialType,
      organization_id: organization.sys.id,
      numTrialDaysLeft: daysLeft,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
    },
  };

  return (
    <Tag className={styles.tag} testId={`${trialType}-trial-tag`}>
      <StateLink
        className={styles.link}
        testId={`${trialType}-trial-tag-link`}
        path={isEnterpriseTrial ? 'account.organizations.subscription_new' : 'spaces.detail.home'}
        params={{ orgId: organization.sys.id, spaceId: space && space.sys.id }}
        {...tracking}
        component={TextLink}
        linkType="white">
        TRIAL - <Pluralized text="DAY" count={daysLeft} />
      </StateLink>
    </Tag>
  );
};
