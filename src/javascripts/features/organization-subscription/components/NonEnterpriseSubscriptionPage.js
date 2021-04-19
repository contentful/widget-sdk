import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  DisplayText,
  Flex,
  Grid,
  Heading,
  Note,
  Typography,
} from '@contentful/forma-36-react-components';

import { isFreeSpacePlan, FREE, SELF_SERVICE } from 'account/pricing/PricingDataProvider';
import { useAsync } from 'core/hooks';
import { Price } from 'core/components/formatting';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { go } from 'states/Navigator';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { captureError } from 'services/logger';

import { createSpace, changeSpace, deleteSpace } from '../utils/spaceUtils';
import { hasAnyInaccessibleSpaces } from '../utils/utils';

import { BasePlanCard } from './BasePlanCard';
import { ContentfulApps } from './ContentfulApps';
import { SpacePlans } from './SpacePlans';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

const fetchContent = (basePlan) => async () => {
  const fetchWebappContentError = new Error(
    'Something went wrong while fetching content from Contentful'
  );
  let basePlanContent;

  try {
    switch (basePlan?.customerType) {
      case FREE:
        basePlanContent = await fetchWebappContentByEntryID('iYmIKepKvlhOx78uwCvbi');
        break;
      case SELF_SERVICE:
        basePlanContent = await fetchWebappContentByEntryID('7y4ItLmbvc3ZGl0L8vtRPB');
        break;
      default:
        break;
    }
  } catch (err) {
    captureError(fetchWebappContentError, err);
  }

  return { basePlanContent };
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

  const { isLoading, error, data } = useAsync(useCallback(fetchContent(basePlan), [basePlan]));

  // TODO: Refactor into own hook to use in both subscription pages
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

  const showContentfulAppsCard = isOrgOwnerOrAdmin;

  const anySpacesInaccessible = !!spacePlans && hasAnyInaccessibleSpaces(spacePlans);

  const freeSpace = spacePlans.find(isFreeSpacePlan);

  return (
    <Grid columns={2} columnGap="spacingXl" rowGap="spacingXl">
      <Flex flexDirection="column" className={styles.fullRow}>
        <BasePlanCard
          loading={isLoading || error}
          content={data?.basePlanContent}
          organizationId={organizationId}
          upgradableSpaceId={freeSpace?.space.sys.id}
          users={
            usersMeta && {
              count: usersMeta.numFree + usersMeta.numPaid,
              limit: usersMeta.hardLimit,
            }
          }
        />
      </Flex>

      {isOrgBillable && <PayingOnDemandOrgCopy grandTotal={grandTotal} />}
      {showContentfulAppsCard && (
        <Flex className={!isOrgBillable && styles.fullRow} flexDirection="column">
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
