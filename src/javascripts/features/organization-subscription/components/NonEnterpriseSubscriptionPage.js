import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  DisplayText,
  Flex,
  Grid,
  Heading,
  Note,
  SkeletonBodyText,
  SkeletonContainer,
  SkeletonDisplayText,
  Typography,
} from '@contentful/forma-36-react-components';

import { go } from 'states/Navigator';

import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { Price } from 'core/components/formatting';

import { BasePlan } from './BasePlan';
import { ContentfulApps } from './ContentfulApps';
import { UsersForPlan } from './UsersForPlan';
import { SpacePlans } from './SpacePlans';
import { isFreePlan } from 'account/pricing/PricingDataProvider';
import { createSpace, changeSpace, deleteSpace } from '../utils/spaceUtils';
import { hasAnyInaccessibleSpaces } from '../utils/utils';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

export function NonEnterpriseSubscriptionPage({
  basePlan,
  addOnPlan,
  usersMeta,
  organization,
  grandTotal,
  initialLoad,
  spacePlans,
  onSpacePlansChange,
  isAppTrialAvailable,
  isAppTrialActive,
  isAppTrialExpired,
}) {
  const organizationId = organization?.sys.id;
  const [changedSpaceId, setChangedSpaceId] = useState('');

  //// TODO: Refactor into own hook to use in both subscription pages
  useEffect(() => {
    let timer;

    if (changedSpaceId) {
      timer = setTimeout(() => {
        setChangedSpaceId(null);
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [changedSpaceId]);

  const handleStartAppTrial = async () => {
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

  const isOrgBillable = organization && organization.isBillable;
  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);

  const showPayingOnDemandCopy = isOrgBillable;

  const showContentfulAppsCard = isOrgOwnerOrAdmin;

  const anySpacesInaccessible = !!spacePlans && hasAnyInaccessibleSpaces(spacePlans);

  const rightColumnHasContent = showPayingOnDemandCopy || showContentfulAppsCard;

  return (
    <Grid columns={2} columnGap="spacingXl" rowGap="spacingXl">
      <Flex flexDirection="column">
        {initialLoad ? (
          <SkeletonContainer svgHeight={117}>
            <SkeletonDisplayText />
            <SkeletonBodyText numberOfLines={4} offsetTop={29} />
          </SkeletonContainer>
        ) : (
          <BasePlan basePlan={basePlan} organizationId={organizationId} />
        )}
        {rightColumnHasContent && (
          <Flex flexDirection="column" marginTop="spacingXl">
            <UsersForPlan
              organizationId={organizationId}
              numberFreeUsers={usersMeta && usersMeta.numFree}
              numberPaidUsers={usersMeta && usersMeta.numPaid}
              costOfUsers={usersMeta && usersMeta.cost}
              unitPrice={usersMeta && usersMeta.unitPrice}
              hardLimit={usersMeta && usersMeta.hardLimit}
              isFreePlan={isFreePlan(basePlan)}
              isOnEnterpriseTrial={false}
            />
          </Flex>
        )}
      </Flex>
      <Flex flexDirection="column">
        {initialLoad ? (
          <SkeletonContainer svgHeight={117}>
            <SkeletonDisplayText />
            <SkeletonBodyText numberOfLines={4} offsetTop={29} />
          </SkeletonContainer>
        ) : (
          <>
            {!rightColumnHasContent && (
              <Flex flexDirection="column" marginBottom="spacingXl">
                <UsersForPlan
                  organizationId={organizationId}
                  numberFreeUsers={usersMeta && usersMeta.numFree}
                  numberPaidUsers={usersMeta && usersMeta.numPaid}
                  costOfUsers={usersMeta && usersMeta.cost}
                  unitPrice={usersMeta && usersMeta.unitPrice}
                  hardLimit={usersMeta && usersMeta.hardLimit}
                  isFreePlan={isFreePlan(basePlan)}
                  isOnEnterpriseTrial={false}
                />
              </Flex>
            )}
            {showPayingOnDemandCopy && (
              <Flex flexDirection="column" marginBottom="spacingXl">
                <PayingOnDemandOrgCopy grandTotal={grandTotal} />
              </Flex>
            )}
            {showContentfulAppsCard && (
              <Flex flexDirection="column">
                <ContentfulApps
                  organizationId={organizationId}
                  startAppTrial={handleStartAppTrial}
                  isTrialAvailable={isAppTrialAvailable}
                  isTrialActive={isAppTrialActive}
                  isTrialExpired={isAppTrialExpired}
                  addOnPlan={addOnPlan}
                />
              </Flex>
            )}
          </>
        )}
      </Flex>

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

NonEnterpriseSubscriptionPage.propTypes = {
  initialLoad: PropTypes.bool.isRequired,
  basePlan: PropTypes.object,
  addOnPlan: PropTypes.object,
  spacePlans: PropTypes.array,
  grandTotal: PropTypes.number,
  usersMeta: PropTypes.object,
  organization: PropTypes.object,
  onSpacePlansChange: PropTypes.func,
  isAppTrialAvailable: PropTypes.bool,
  isAppTrialActive: PropTypes.bool,
  isAppTrialExpired: PropTypes.bool,
};

NonEnterpriseSubscriptionPage.defaultProps = {
  initialLoad: true,
};

function PayingOnDemandOrgCopy({ grandTotal }) {
  return (
    <Typography>
      <Heading className="section-title">Monthly total</Heading>
      <DisplayText
        element="h2"
        data-test-id="subscription-page.sidebar.grand-total"
        className={styles.grandTotal}>
        <Price value={grandTotal} testId="on-demand-monthly-cost" />
      </DisplayText>
      <Note>
        The amount on your invoice might differ from the amount shown above because of usage
        overages or changes you make to the subscription during a billing cycle.
      </Note>
    </Typography>
  );
}

PayingOnDemandOrgCopy.propTypes = {
  grandTotal: PropTypes.number.isRequired,
};
