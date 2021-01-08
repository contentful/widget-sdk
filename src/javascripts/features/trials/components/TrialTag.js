import React, { useState, useCallback } from 'react';
import { css } from 'emotion';
import { Tag, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Pluralized } from 'core/components/formatting';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import StateLink from 'app/common/StateLink';
import { useAsync } from 'core/hooks';
import { calcTrialDaysLeft } from '../utils/utils';
import { getModule } from 'core/NgRegistry';
import { getOrganization, getSpace } from 'services/TokenStore';
import {
  isOrganizationOnTrial,
  isSpaceOnTrial,
  isExpiredTrialSpace,
} from '../services/TrialService';
import { logError } from 'services/logger';
import { CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import * as Navigator from 'states/Navigator';
import { EVENTS } from '../utils/analyticsTracking';

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

  const { orgId, spaceId } = getModule('$stateParams');

  const fetchData = useCallback(async () => {
    let org;
    let space;

    if (Navigator.isOrgRoute()) {
      org = await getOrganization(orgId);
    }

    if (Navigator.isSpaceRoute()) {
      try {
        space = await getSpace(spaceId);
        org = space.organization;
      } catch (err) {
        // space is invalid or inaccessible
        space = undefined;
      }
    }

    setOrganization(org);
    setSpace(space);
  }, [spaceId, orgId]);

  const { isLoading } = useAsync(fetchData);

  const isEnterpriseTrial = isOrganizationOnTrial(organization);
  const isSpaceTrial = isSpaceOnTrial(space);
  const isExpiredSpace = isExpiredTrialSpace(space);

  if (isEnterpriseTrial && isSpaceTrial) {
    logError('Unexpected behaviour, both space and organization are on trial', {
      organization,
      space,
    });
    return null;
  }

  if (isLoading || space?.readOnlyAt || (!isEnterpriseTrial && !isSpaceTrial && !isExpiredSpace)) {
    return null;
  }

  const daysLeft = isEnterpriseTrial
    ? calcTrialDaysLeft(organization.trialPeriodEndsAt)
    : calcTrialDaysLeft(space.trialPeriodEndsAt);

  const trialType = isEnterpriseTrial ? 'platform' : 'space';

  const tracking = {
    trackingEvent: `trial:${EVENTS.TRIAL_TAG}`,
    trackParams: {
      type: trialType,
      numTrialDaysLeft: daysLeft,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
    },
  };

  return (
    <Tag className={styles.tag} testId={`${trialType}-trial-tag`}>
      <TrackTargetedCTAImpression
        impressionType={
          isEnterpriseTrial ? CTA_EVENTS.ENTERPRISE_TRIAL_TAG : CTA_EVENTS.TRIAL_SPACE_TAG
        }
        meta={{ spaceId: space?.sys.id, organizationId: organization?.sys.id }}>
        <StateLink
          className={styles.link}
          testId={`${trialType}-trial-tag-link`}
          path={isEnterpriseTrial ? 'account.organizations.subscription_new' : 'spaces.detail.home'}
          params={{ orgId: organization.sys.id, spaceId: space && space.sys.id }}
          {...tracking}
          component={TextLink}
          linkType="white">
          TRIAL - {isExpiredSpace ? 'EXPIRED' : <Pluralized text="DAY" count={daysLeft} />}
        </StateLink>
      </TrackTargetedCTAImpression>
    </Tag>
  );
};
