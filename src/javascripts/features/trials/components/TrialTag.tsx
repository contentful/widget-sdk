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
import {
  isOrganizationOnTrial,
  isSpaceOnTrial,
  isExpiredTrialSpace,
} from '../services/TrialService';
import { CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import * as Navigator from 'states/Navigator';
import { EVENTS } from '../utils/analyticsTracking';
import * as Repo from '../services/AppTrialRepo';
import { isExpiredAppTrial, isActiveAppTrial } from '../services/AppTrialService';
import { AppTrialFeature } from '../types/AppTrial';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { Organization } from 'core/services/SpaceEnvContext/types';
import { useAppsTrial } from '../hooks/useAppsTrials';

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
  appFeature?: AppTrialFeature;
  isAppsTrialSpaceAccessible?: boolean;
};

export const TrialTag = ({ organizationId }: TrialTagProps) => {
  const { currentSpaceData: space } = useSpaceEnvContext();
  const { appsTrialSpaceKey } = useAppsTrial(
    organizationId ?? (space?.organization.sys.id as string)
  );

  const fetchData = useCallback(async () => {
    const organization = organizationId
      ? await getOrganization(organizationId)
      : space?.organization;

    if (organization) {
      const appFeature = await Repo.getTrial(organization.sys.id);
      const isAppsTrialSpaceAccessible = await isSpaceAccessible(appsTrialSpaceKey);

      return {
        appFeature,
        organization,
        isAppsTrialSpaceAccessible,
      };
    }

    return { organization };
  }, [space, organizationId, appsTrialSpaceKey]);

  const {
    isLoading,
    data: { appFeature, isAppsTrialSpaceAccessible, organization } = {},
  } = useAsync<TrialData>(fetchData);

  const isEnterpriseTrial = isOrganizationOnTrial(organization);
  const isAppTrial = isActiveAppTrial(appFeature);
  const isAppTrialExpired = isExpiredAppTrial(appFeature);
  const isTrialSpace = isSpaceOnTrial(space);
  const isTrialSpaceExpired = isExpiredTrialSpace(space);

  if (isLoading || space?.readOnlyAt) {
    return null;
  }

  if (
    !isEnterpriseTrial &&
    !isTrialSpace &&
    !isAppTrial &&
    !isTrialSpaceExpired &&
    !isAppTrialExpired
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
  } else if (isAppTrial || isAppTrialExpired) {
    if (isAppTrialExpired && (Navigator.isOrgRoute() || space?.sys.id !== appsTrialSpaceKey)) {
      // only display the expired app tag on the SpaceNavBar of the Apps Trial Space
      return null;
    }

    daysLeft = calcTrialDaysLeft(appFeature?.sys.trial?.endsAt);
    ctaType = CTA_EVENTS.APP_TRIAL_TAG;
    pathParamsObj = isAppsTrialSpaceAccessible
      ? {
          path: 'spaces.detail.home',
          params: { spaceId: appsTrialSpaceKey },
        }
      : undefined;
  } else if (isTrialSpace || isTrialSpaceExpired) {
    daysLeft = calcTrialDaysLeft(space?.trialPeriodEndsAt);
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
            isAppTrialExpired || isTrialSpaceExpired ? (
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
