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

import { isFreeSpacePlan } from 'account/pricing/PricingDataProvider';
import { useAsync } from 'core/hooks';
import { Price } from 'core/components/formatting';
import type { Organization } from 'core/services/SpaceEnvContext/types';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { PlanCustomerType, BasePlan, AddOnProductRatePlan } from 'features/pricing-entities';
import { go } from 'states/Navigator';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { captureError } from 'services/logger';

import { createSpace, changeSpace, deleteSpace } from '../utils/spaceUtils';
import { hasAnyInaccessibleSpaces } from '../utils/utils';
import { useChangedSpace } from '../hooks/useChangedSpace';

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

const fetchContent = (basePlan: BasePlan) => async (): Promise<{
  basePlanContent: BasePlanContent;
}> => {
  const fetchWebappContentError = new Error(
    'Something went wrong while fetching content from Contentful'
  );
  let basePlanContent;

  try {
    switch (basePlan?.customerType) {
      case PlanCustomerType.FREE:
        basePlanContent = await fetchWebappContentByEntryID(BasePlanContentEntryIds.FREE);
        break;
      case PlanCustomerType.SELF_SERVICE:
        basePlanContent = await fetchWebappContentByEntryID(BasePlanContentEntryIds.SELF_SERVICE);
        break;
      default:
        break;
    }
  } catch (err) {
    captureError(fetchWebappContentError, err);
  }

  return { basePlanContent };
};

interface NonEnterpriseSubscriptionPageProps {
  addOnPlan: AddOnProductRatePlan;
  basePlan: BasePlan;
  grandTotal: number;
  initialLoad: boolean;
  onSpacePlansChange: () => void;
  organization: Organization;
  spacePlans: SpacePlan[];
  usersMeta: UsersMeta;
}

export function NonEnterpriseSubscriptionPage({
  addOnPlan,
  basePlan,
  grandTotal,
  initialLoad = false,
  onSpacePlansChange,
  organization,
  spacePlans,
  usersMeta,
}: NonEnterpriseSubscriptionPageProps) {
  const { isLoading, error, data } = useAsync(useCallback(fetchContent(basePlan), [basePlan]));
  const { changedSpaceId, setChangedSpaceId } = useChangedSpace();

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

  const onCreateSpace = createSpace(organizationId);
  const onChangeSpace = changeSpace(
    organizationId,
    spacePlans,
    onSpacePlansChange,
    setChangedSpaceId
  );
  const onDeleteSpace = deleteSpace(spacePlans, onSpacePlansChange);

  return (
    <Grid testId="non-enterprise-subs-page" columns={2} columnGap="spacingXl" rowGap="spacingXl">
      <Flex flexDirection="column" className={styles.fullRow}>
        <BasePlanCard
          loading={isLoading || !!error}
          content={data?.basePlanContent}
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
          spacePlans={spacePlans}
          upgradedSpaceId={changedSpaceId}
          onCreateSpace={onCreateSpace}
          onChangeSpace={onChangeSpace}
          organizationId={organizationId}
          onDeleteSpace={onDeleteSpace}
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
