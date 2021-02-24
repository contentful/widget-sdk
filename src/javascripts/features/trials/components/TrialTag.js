import React, { useState, useCallback } from 'react';
import { css } from 'emotion';
import { Tag, TextLink } from '@contentful/forma-36-react-components';
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
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { createAppTrialRepo } from '../services/AppTrialRepo';
import {
  isExpiredAppTrial,
  isActiveAppTrial,
  getAppTrialSpaceKey,
} from '../services/AppTrialService';
import { FLAGS, getVariation } from 'LaunchDarkly';

const styles = {
  tag: css({
    margin: 'auto',
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

    const showAppTag = await getVariation(FLAGS.APP_TRIAL, {
      organizationId: org.sys.id,
    });

    if (showAppTag) {
      const orgEndpoint = createOrganizationEndpoint(org.sys.id);
      const appFeature = await createAppTrialRepo(orgEndpoint).getTrial('compose_app');
      const appTrialSpaceId = await getAppTrialSpaceKey(appFeature);
      return {
        appFeature,
        appTrialSpaceId,
      };
    }
  }, [spaceId, orgId]);

  const { isLoading, data = {} } = useAsync(fetchData);

  const isEnterpriseTrial = isOrganizationOnTrial(organization);
  const isAppTrial = isActiveAppTrial(data.appFeature);
  const isAppTrialExpired = isExpiredAppTrial(data.appFeature);
  const isTrialSpace = isSpaceOnTrial(space);
  const isTrialSpaceExpired = isExpiredTrialSpace(space);

  if (isEnterpriseTrial && isTrialSpace) {
    logError('Unexpected behaviour, both space and organization are on trial', {
      organization,
      space,
    });
    return null;
  }

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

  let daysLeft;
  let ctaType;
  let pathParamsObj;

  if (isEnterpriseTrial) {
    daysLeft = calcTrialDaysLeft(organization.trialPeriodEndsAt);
    ctaType = CTA_EVENTS.ENTERPRISE_TRIAL_TAG;
    pathParamsObj = {
      path: 'account.organizations.subscription_new',
      params: { orgId: organization.sys.id },
    };
  } else if (isAppTrial || isAppTrialExpired) {
    if (isAppTrialExpired && (Navigator.isOrgRoute() || space.sys.id !== data.appTrialSpaceId)) {
      // only display App expired tag on the App Trial Space
      return null;
    }
    daysLeft = calcTrialDaysLeft(data.appFeature.sys.trial.endsAt);
    ctaType = CTA_EVENTS.APP_TRIAL_TAG;
    pathParamsObj = data.appTrialSpaceId
      ? {
          path: 'spaces.detail.home',
          params: { spaceId: data.appTrialSpaceId },
        }
      : undefined;
  } else if (isTrialSpace || isTrialSpaceExpired) {
    daysLeft = calcTrialDaysLeft(space.trialPeriodEndsAt);
    ctaType = CTA_EVENTS.TRIAL_SPACE_TAG;
    pathParamsObj = {
      path: 'spaces.detail.home',
      params: { spaceId: space.sys.id },
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

  const renderContent = () => (
    <div>
      TRIAL -{' '}
      {isAppTrialExpired || isTrialSpaceExpired ? (
        'EXPIRED'
      ) : (
        <Pluralized text="DAY" count={daysLeft} />
      )}
    </div>
  );
  return (
    <Tag className={styles.tag} tagType="primary-filled" testId={`${ctaType}`}>
      <TrackTargetedCTAImpression impressionType={ctaType}>
        {pathParamsObj ? (
          <StateLink
            className={styles.link}
            testId={`${ctaType}-link`}
            {...pathParamsObj}
            {...tracking}
            component={TextLink}
            linkType="white">
            {renderContent()}
          </StateLink>
        ) : (
          renderContent()
        )}
      </TrackTargetedCTAImpression>
    </Tag>
  );
};
