import React, { useCallback } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Tag, Tooltip } from '@contentful/forma-36-react-components';
import { Pluralized } from 'core/components/formatting';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import StateLink from 'app/common/StateLink';
import { useAsync } from 'core/hooks';
import { calcTrialDaysLeft, isSpaceAccessible } from '../utils/utils';
import { getOrganization } from 'services/TokenStore';
import { isOrganizationOnTrial } from '../services/TrialService';
import { CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import * as Navigator from 'states/Navigator';
import { EVENTS } from '../utils/analyticsTracking';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { Organization } from 'core/services/SpaceEnvContext/types';
import { useAppsTrial } from '../hooks/useAppsTrial';
import { useTrialSpace } from '../hooks/useTrialSpace';

const styles = {
  tag: css({
    margin: 'auto',

    a: {
      color: tokens.colorPurpleBase,
    },

    'a:link': {
      color: tokens.colorPurpleBase,

      ':hover': {
        textDecoration: 'underline',
      },
    },
  }),
};

export interface TrialTagProps {
  organizationId?: string;
}

type TrialData = {
  organization: Organization | undefined;
  isAppsTrialSpaceAccessible?: boolean;
};

export const TrialTag = ({ organizationId }: TrialTagProps) => {
  const { currentSpaceData: space } = useSpaceEnvContext();

  const orgId = organizationId ?? space?.organization.sys.id;

  const {
    appsTrialSpaceKey,
    isAppsTrialActive,
    hasAppsTrialExpired,
    appsTrialEndsAt,
  } = useAppsTrial(orgId);

  const {
    isActiveTrialSpace,
    hasTrialSpaceExpired,
    hasTrialSpaceConverted,
    trialSpaceExpiresAt,
    matchesAppsTrialSpaceKey,
  } = useTrialSpace(orgId, space?.sys.id);

  const fetchData = useCallback(async () => {
    const organization = organizationId
      ? await getOrganization(organizationId)
      : space?.organization;
    const isAppsTrialSpaceAccessible = await isSpaceAccessible(appsTrialSpaceKey);

    return {
      organization,
      isAppsTrialSpaceAccessible,
    };
  }, [space, organizationId, appsTrialSpaceKey]);

  const { isLoading, data: { isAppsTrialSpaceAccessible, organization } = {} } = useAsync<
    TrialData
  >(fetchData);

  const isEnterpriseTrial = isOrganizationOnTrial(organization);
  const isTrialSpaceExpired = hasTrialSpaceExpired && !hasTrialSpaceConverted;

  if (isLoading || space?.readOnlyAt) {
    return null;
  }

  if (
    !isEnterpriseTrial &&
    !isActiveTrialSpace &&
    !isAppsTrialActive &&
    !isTrialSpaceExpired &&
    !hasAppsTrialExpired
  ) {
    return null;
  }

  let daysLeft = -1;
  let ctaType = '';
  let pathParamsObj: { path: string; params: { [key: string]: unknown } } | undefined;

  if (isEnterpriseTrial) {
    daysLeft = calcTrialDaysLeft(organization?.trialPeriodEndsAt);
    ctaType = CTA_EVENTS.ENTERPRISE_TRIAL_TAG;
    pathParamsObj = {
      path: 'account.organizations.subscription_new',
      params: { orgId: organization?.sys.id },
    };
  } else if (isAppsTrialActive || hasAppsTrialExpired) {
    if (
      hasAppsTrialExpired &&
      (Navigator.isOrgRoute() || !matchesAppsTrialSpaceKey || hasTrialSpaceConverted)
    ) {
      return null;
    }
    // only display the expired apps trial tag on the SpaceNavBar of the Apps
    // Trial Space when it hasn't been purchased

    daysLeft = calcTrialDaysLeft(appsTrialEndsAt);
    ctaType = CTA_EVENTS.APP_TRIAL_TAG;
    pathParamsObj = isAppsTrialSpaceAccessible
      ? {
          path: 'spaces.detail.home',
          params: { spaceId: appsTrialSpaceKey },
        }
      : undefined;
  } else if (isActiveTrialSpace || isTrialSpaceExpired) {
    daysLeft = calcTrialDaysLeft(trialSpaceExpiresAt);
    ctaType = CTA_EVENTS.TRIAL_SPACE_TAG;
    pathParamsObj = {
      path: 'spaces.detail.home',
      params: { spaceId: space?.sys.id },
    };
  }

  const tracking = {
    trackingEvent: `trial:${EVENTS.TRIAL_TAG}`,
    trackParams: {
      type: ctaType,
      numTrialDaysLeft: daysLeft,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
    },
  };

  return (
    <Tag className={styles.tag} tagType="featured" testId={`${ctaType}`}>
      <TrackTargetedCTAImpression impressionType={ctaType}>
        <Tooltip
          testId="trial_tag-tooltip"
          place="bottom"
          content={
            !isEnterpriseTrial && (hasAppsTrialExpired || isTrialSpaceExpired) ? (
              'EXPIRED'
            ) : (
              <Pluralized text="DAY" count={daysLeft} />
            )
          }>
          {pathParamsObj ? (
            <StateLink data-test-id={`${ctaType}-link`} {...pathParamsObj} {...tracking}>
              TRIAL
            </StateLink>
          ) : (
            <>TRIAL</>
          )}
        </Tooltip>
      </TrackTargetedCTAImpression>
    </Tag>
  );
};
