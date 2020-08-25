import React, { useState, useCallback } from 'react';
import { css } from 'emotion';
import { Tag, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { getCurrentOrg } from 'core/utils/getCurrentOrg';
import { Pluralized } from 'core/components/formatting';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import StateLink from 'app/common/StateLink';
import { useAsync } from 'core/hooks';
import { initTrialProductTour } from '../services/intercomProductTour';
import { calcTrialDaysLeft } from '../utils';
import { isOrgOnPlatformTrial } from '../services/PlatformTrialService';

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
  const [isPlatformTrialCommEnabled, setIsPlatformTrialCommEnabled] = useState(false);

  const fetchData = useCallback(async () => {
    const org = await getCurrentOrg();
    const isPlatformTrialCommEnabled = await getVariation(FLAGS.PLATFORM_TRIAL_COMM, {
      organizationId: org.sys.id,
    });

    if (isPlatformTrialCommEnabled && isOrgOnPlatformTrial(org)) {
      initTrialProductTour();
    }

    setIsPlatformTrialCommEnabled(isPlatformTrialCommEnabled);
    setOrganization(org);
  }, []);

  const { isLoading } = useAsync(fetchData);

  // organization can be null if the current page is Account settings or Error Home
  if (
    isLoading ||
    !organization ||
    isLegacyOrganization(organization) ||
    !isPlatformTrialCommEnabled ||
    !isOrgOnPlatformTrial(organization)
  ) {
    return null;
  }

  const daysLeft = calcTrialDaysLeft(organization.trialPeriodEndsAt);

  const tracking = {
    trackingEvent: 'trial:trial_tag_clicked',
    trackParams: {
      type: 'platform',
      organization_id: organization.sys.id,
      numTrialDaysLeft: daysLeft,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
    },
  };

  return (
    <Tag className={styles.tag} testId="trial-tag">
      <StateLink
        className={styles.link}
        testId="trial-tag-link"
        path="account.organizations.subscription_new"
        params={{ orgId: organization.sys.id }}
        {...tracking}
        component={TextLink}
        linkType="white">
        TRIAL - <Pluralized text="DAY" count={daysLeft} />
      </StateLink>
    </Tag>
  );
};
