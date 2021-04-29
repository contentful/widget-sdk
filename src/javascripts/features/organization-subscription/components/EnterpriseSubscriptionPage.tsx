import React, { useCallback } from 'react';
import { css } from 'emotion';
import { Flex, Grid } from '@contentful/forma-36-react-components';

import { useAsync } from 'core/hooks';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import type { Organization } from 'core/services/SpaceEnvContext/types';
import {
  EnterpriseTrialInfo,
  isOrganizationOnTrial,
  SpacesListForMembers,
  calcTrialDaysLeft,
} from 'features/trials';
import { captureError } from 'core/monitoring';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import type { BasePlanContent, SpacePlan, UsersMeta } from '../types';
import { BasePlanContentEntryIds } from '../types';
import { hasAnyInaccessibleSpaces } from '../utils/utils';

import { BasePlanCard } from './BasePlanCard';
import { SpacePlans } from './SpacePlans';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

const fetchContent = (isOnTrial: boolean) => async (): Promise<{
  basePlanContent: BasePlanContent;
}> => {
  const fetchWebappContentError = new Error(
    'Something went wrong while fetching content from Contentful'
  );
  let basePlanContent;

  try {
    const entryId = BasePlanContentEntryIds[isOnTrial ? 'ENTERPRISE_TRIAL' : 'ENTERPRISE'];

    basePlanContent = await fetchWebappContentByEntryID(entryId);
  } catch (err) {
    captureError(fetchWebappContentError, err);
  }

  return { basePlanContent };
};

interface EnterpriseSubscriptionPageProps {
  initialLoad: boolean;
  memberAccessibleSpaces: unknown[];
  organization: Organization;
  spacePlans: SpacePlan[];
  usersMeta: UsersMeta;
}

export function EnterpriseSubscriptionPage({
  initialLoad,
  memberAccessibleSpaces,
  organization,
  spacePlans,
  usersMeta,
}: EnterpriseSubscriptionPageProps) {
  const organizationId = organization.sys.id;
  const isOrgOnEnterpriseTrial = isOrganizationOnTrial(organization);

  const { isLoading, error, data } = useAsync(
    useCallback(fetchContent(isOrgOnEnterpriseTrial), [])
  );

  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);
  const isNotAdminOrOwnerOfTrialOrg = isOrgOnEnterpriseTrial && !isOrgOwnerOrAdmin;
  const anySpacesInaccessible = !!spacePlans && hasAnyInaccessibleSpaces(spacePlans);

  // if this is an org on Enterprise trial we show how many days of trial the user has
  let daysOfTrial;
  if (isOrgOnEnterpriseTrial) {
    daysOfTrial = calcTrialDaysLeft(organization.trialPeriodEndsAt);
  }

  return (
    <Grid testId="enterprise-subs-page" columns={2} columnGap="spacingXl" rowGap="spacingXl">
      <Flex flexDirection="column" className={styles.fullRow}>
        <BasePlanCard
          loading={isLoading || !!error}
          content={data?.basePlanContent}
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

      {isOrgOnEnterpriseTrial && (
        <Flex className={styles.fullRow} flexDirection="column">
          <EnterpriseTrialInfo />
        </Flex>
      )}

      <Flex className={styles.fullRow} flexDirection="column">
        {isNotAdminOrOwnerOfTrialOrg ? (
          <SpacesListForMembers spaces={memberAccessibleSpaces} />
        ) : (
          <SpacePlans
            initialLoad={initialLoad}
            organizationId={organizationId}
            enterprisePlan={true}
            anySpacesInaccessible={anySpacesInaccessible}
            isOwnerOrAdmin={isOrgOwnerOrAdmin}
          />
        )}
      </Flex>
    </Grid>
  );
}
