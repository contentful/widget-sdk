import React, { useCallback, useContext } from 'react';
import { css, cx } from 'emotion';
import {
  DisplayText,
  Flex,
  Grid,
  Heading,
  Note,
  Typography,
} from '@contentful/forma-36-react-components';

import {
  isFreeSpacePlan,
  isFreePlan,
  isSelfServicePlan,
  isPartnerPlan,
  isProBonoPlan,
} from 'account/pricing/PricingDataProvider';
import { useAsync } from 'core/hooks';
import { Price } from 'core/components/formatting';
import type { Organization } from 'classes/spaceContextTypes';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import type { BasePlan, AddOnProductRatePlan } from 'features/pricing-entities';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { captureError } from 'core/monitoring';

import type { BasePlanContent, UsersMeta } from '../types';
import { BasePlanContentEntryIds } from '../types';
import { OrgSubscriptionContext } from '../context';
import { BasePlanCard } from './BasePlanCard';
import { ContentfulApps } from './ContentfulApps';
import { SpacePlans } from './SpacePlans';
import { router } from 'core/react-routing';
import { V1MigrationNote } from './V1MigrationNote';
import { generateBasePlanName } from '../utils/generateBasePlanName';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

async function fetchContent(basePlan: BasePlan): Promise<BasePlanContent | undefined> {
  const fetchWebappContentError = new Error(
    'Something went wrong while fetching content from Contentful'
  );

  try {
    if (isFreePlan(basePlan)) {
      return await fetchWebappContentByEntryID(BasePlanContentEntryIds.FREE);
    }

    if (isSelfServicePlan(basePlan)) {
      return await fetchWebappContentByEntryID(BasePlanContentEntryIds.SELF_SERVICE);
    }

    if (isPartnerPlan(basePlan)) {
      return await fetchWebappContentByEntryID(BasePlanContentEntryIds.PARTNER);
    }

    if (isProBonoPlan(basePlan)) {
      return await fetchWebappContentByEntryID(BasePlanContentEntryIds.PRO_BONO);
    }
  } catch (err) {
    captureError(fetchWebappContentError, { extra: { err } });
  }

  return undefined;
}

interface NonEnterpriseSubscriptionPageProps {
  addOnPlan: AddOnProductRatePlan;
  basePlan: BasePlan;
  grandTotal: number;
  organization: Organization;
  usersMeta: UsersMeta;
}

export function NonEnterpriseSubscriptionPage({
  addOnPlan,
  basePlan,
  grandTotal,
  organization,
  usersMeta,
}: NonEnterpriseSubscriptionPageProps) {
  const {
    state: { spacePlans },
  } = useContext(OrgSubscriptionContext);

  const {
    isLoading,
    error,
    data: content,
  } = useAsync(useCallback(() => fetchContent(basePlan), [basePlan]));

  const organizationId = organization.sys.id;
  const isOrgBillable = organization.isBillable;
  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);
  const freeSpace = spacePlans.find(isFreeSpacePlan);
  // TODO: cleanup after 6 months from v1 migration
  const isV1MigrationSucceeded = organization.sys?._v1Migration?.status === 'succeeded';
  const v1migrationDestination = organization.sys?._v1Migration?.destination;

  const basePlanName = generateBasePlanName(basePlan, v1migrationDestination);

  const onStartAppTrial = async () => {
    router.navigate({
      path: 'account.organizations.start_trial',
      orgId: organizationId,
      navigationState: {
        existingUsers: true,
        from: 'subscription',
      },
    });
  };

  return (
    <Grid testId="non-enterprise-subs-page" columns={2} columnGap="spacingXl" rowGap="spacingXl">
      {isV1MigrationSucceeded && (
        <V1MigrationNote basePlanName={basePlanName} className={styles.fullRow} />
      )}
      <Flex flexDirection="column" className={styles.fullRow}>
        <BasePlanCard
          loading={isLoading || !!error}
          content={content}
          organizationId={organizationId}
          upgradableSpaceId={freeSpace?.space?.sys.id}
          users={
            usersMeta && {
              count: usersMeta.numFree + usersMeta.numPaid,
              limit: usersMeta.hardLimit,
            }
          }
        />
      </Flex>

      {isOrgBillable && <PayingOnDemandOrgCopy grandTotal={grandTotal} />}
      {isOrgOwnerOrAdmin && (
        <Flex className={cx({ [styles.fullRow]: !isOrgBillable })} flexDirection="column">
          <ContentfulApps
            organizationId={organizationId}
            startAppTrial={onStartAppTrial}
            addOnPlan={addOnPlan}
          />
        </Flex>
      )}

      <Flex className={styles.fullRow} flexDirection="column">
        <SpacePlans
          organizationId={organizationId}
          isOwnerOrAdmin={isOrgOwnerOrAdmin}
          showV1MigrationCommunication={isV1MigrationSucceeded && v1migrationDestination === 'team'}
        />
      </Flex>
    </Grid>
  );
}

interface PayingOnDemandOrgCopyProps {
  grandTotal: number;
}

function PayingOnDemandOrgCopy({ grandTotal }: PayingOnDemandOrgCopyProps) {
  return (
    <Typography>
      <Heading className="section-title">Monthly total</Heading>
      <DisplayText element="h2" data-test-id="subscription-page.sidebar.grand-total">
        <Price value={grandTotal} testId="on-demand-monthly-cost" />
      </DisplayText>
      <Note>
        The amount on your invoice might differ from the amount shown above because of usage
        overages or changes you make to the subscription during a billing cycle.
      </Note>
    </Typography>
  );
}
