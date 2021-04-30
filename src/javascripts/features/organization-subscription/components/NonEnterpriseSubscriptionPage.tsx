import React, { useCallback } from 'react';
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
import type { Organization } from 'core/services/SpaceEnvContext/types';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import type { BasePlan, AddOnProductRatePlan } from 'features/pricing-entities';
import { go } from 'states/Navigator';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { captureError } from 'core/monitoring';

import { hasAnyInaccessibleSpaces } from '../utils/utils';

import type { BasePlanContent, SpacePlan, UsersMeta } from '../types';
import { BasePlanContentEntryIds } from '../types';
import { BasePlanCard } from './BasePlanCard';
import { ContentfulApps } from './ContentfulApps';
import { SpacePlans } from './SpacePlans';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

const fetchContent = (basePlan: BasePlan) => async (): Promise<BasePlanContent | undefined> => {
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
    captureError(fetchWebappContentError, err);
  }

  return undefined;
};

interface NonEnterpriseSubscriptionPageProps {
  addOnPlan: AddOnProductRatePlan;
  basePlan: BasePlan;
  grandTotal: number;
  initialLoad: boolean;
  organization: Organization;
  spacePlans: SpacePlan[];
  usersMeta: UsersMeta;
}

export function NonEnterpriseSubscriptionPage({
  addOnPlan,
  basePlan,
  grandTotal,
  initialLoad = false,
  organization,
  spacePlans,
  usersMeta,
}: NonEnterpriseSubscriptionPageProps) {
  const { isLoading, error, data: content } = useAsync(
    useCallback(fetchContent(basePlan), [basePlan])
  );

  const organizationId = organization.sys.id;
  const isOrgBillable = organization.isBillable;
  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);
  const anySpacesInaccessible = hasAnyInaccessibleSpaces(spacePlans);
  const freeSpace = spacePlans.find(isFreeSpacePlan);

  const onStartAppTrial = async () => {
    go({
      path: ['account', 'organizations', 'start_trial'],
      params: { orgId: organizationId, existingUsers: true, from: 'subscription' },
    });
  };

  return (
    <Grid testId="non-enterprise-subs-page" columns={2} columnGap="spacingXl" rowGap="spacingXl">
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
          initialLoad={initialLoad}
          organizationId={organizationId}
          enterprisePlan={false}
          anySpacesInaccessible={anySpacesInaccessible}
          isOwnerOrAdmin={isOrgOwnerOrAdmin}
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
