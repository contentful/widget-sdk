import React, { useCallback } from 'react';
import { css } from 'emotion';
import { Flex, Grid } from '@contentful/forma-36-react-components';

import { useAsync } from 'core/hooks';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import type { Organization } from 'classes/spaceContextTypes';
import {
  EnterpriseTrialInfo,
  isOrganizationOnTrial,
  SpacesListForMembers,
  calcTrialDaysLeft,
} from 'features/trials';
import { captureError } from 'core/monitoring';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import type { BasePlanContent, UsersMeta } from '../types';
import { BasePlanContentEntryIds } from '../types';

import { BasePlanCard } from './BasePlanCard';
import { SpacePlans } from './SpacePlans';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

async function fetchContent(
  isOnTrial: boolean,
  isInternalBasePlan: boolean
): Promise<BasePlanContent> {
  const fetchWebappContentError = new Error(
    'Something went wrong while fetching content from Contentful'
  );
  let basePlanContent;

  try {
    let entryId = BasePlanContentEntryIds.ENTERPRISE;

    if (isInternalBasePlan) {
      entryId = BasePlanContentEntryIds.CONTENTFUL_INTERNAL;
    } else if (isOnTrial) {
      entryId = BasePlanContentEntryIds.ENTERPRISE_TRIAL;
    }

    basePlanContent = await fetchWebappContentByEntryID(entryId);
  } catch (err) {
    captureError(fetchWebappContentError, { extra: err });
  }

  return basePlanContent;
}

interface EnterpriseSubscriptionPageProps {
  memberAccessibleSpaces: unknown[];
  organization: Organization;
  usersMeta?: UsersMeta;
  isInternalBasePlan?: boolean;
}

export function EnterpriseSubscriptionPage({
  memberAccessibleSpaces,
  organization,
  usersMeta,
  isInternalBasePlan = false,
}: EnterpriseSubscriptionPageProps) {
  const organizationId = organization.sys.id;
  const isOrgOnEnterpriseTrial = isOrganizationOnTrial(organization);

  const {
    isLoading,
    error,
    data: content,
  } = useAsync(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => fetchContent(isOrgOnEnterpriseTrial, isInternalBasePlan), [])
  );

  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);

  // if this is an org on Enterprise trial we show how many days of trial the user has
  let daysOfTrial;
  if (isOrgOnEnterpriseTrial) {
    daysOfTrial = calcTrialDaysLeft(organization.trialPeriodEndsAt);
  }

  return (
    <Grid testId="enterprise-subs-page" columns={2} columnGap="spacingXl" rowGap="spacingXl">
      {isOrgOwnerOrAdmin && (
        <Flex flexDirection="column" className={styles.fullRow}>
          <BasePlanCard
            loading={isLoading || !!error}
            content={content}
            organizationId={organizationId}
            users={
              usersMeta && {
                count: usersMeta.numFree + usersMeta.numPaid,
                limit: usersMeta.hardLimit,
              }
            }
            daysOfTrial={daysOfTrial}
          />
        </Flex>
      )}

      {isOrgOnEnterpriseTrial && (
        <Flex className={styles.fullRow} flexDirection="column">
          <EnterpriseTrialInfo />
        </Flex>
      )}

      <Flex className={styles.fullRow} flexDirection="column">
        {!isOrgOwnerOrAdmin && isOrgOnEnterpriseTrial ? (
          <SpacesListForMembers spaces={memberAccessibleSpaces} />
        ) : (
          <SpacePlans
            enterprisePlan
            organizationId={organizationId}
            isOwnerOrAdmin={isOrgOwnerOrAdmin}
          />
        )}
      </Flex>
    </Grid>
  );
}
