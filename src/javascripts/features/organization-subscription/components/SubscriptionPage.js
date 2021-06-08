import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  DisplayText,
  Flex,
  Grid,
  Heading,
  Note,
  Paragraph,
  TextLink,
  Typography,
} from '@contentful/forma-36-react-components';

import { isEnterprisePlan, isFreePlan } from 'account/pricing/PricingDataProvider';
import { isOrganizationOnTrial, EnterpriseTrialInfo, SpacesListForMembers } from 'features/trials';
import { Price } from 'core/components/formatting';
import { useRouteNavigate } from 'core/react-routing';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { createSpace } from '../utils/spaceUtils';

import { BasePlan } from './BasePlan';
import { ContentfulApps } from './ContentfulApps';
import { UsersForPlan } from './UsersForPlan';
import { SpacePlans } from './SpacePlans';
import { V1MigrationNote } from './V1MigrationNote';
import { generateBasePlanName } from '../utils/generateBasePlanName';
import { useCalculateSubscriptionCosts } from '../hooks/useCalculateSubscriptionCosts';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

export function SubscriptionPage({
  basePlan,
  addOnPlan,
  usersMeta,
  organization,
  memberAccessibleSpaces,
}) {
  const organizationId = organization?.sys.id;
  const routeNavigate = useRouteNavigate();
  const subscriptionCosts = useCalculateSubscriptionCosts();
  const onCreateSpace = createSpace(organizationId);

  const handleStartAppTrial = async () => {
    routeNavigate({
      path: 'account.organizations.start_trial',
      orgId: organizationId,
      navigationState: {
        existingUsers: true,
        from: 'subscription',
      },
    });
  };

  const enterprisePlan = basePlan && isEnterprisePlan(basePlan);
  const isOrgBillable = organization && organization.isBillable;
  const isOrgOwner = isOwner(organization);
  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);
  const isOrgOnTrial = isOrganizationOnTrial(organization);
  const isNotAdminOrOwnerOfTrialOrg = isOrgOnTrial && !isOrgOwnerOrAdmin;

  const showPayingOnDemandCopy = isOrgBillable && !enterprisePlan;
  const showNonPayingOrgCopy = !isOrgBillable && isOrgOwner && !isOrgOnTrial;

  // Contentful Apps card should not show to Enterprise orgs and user is not Admin/Owner
  const showContentfulAppsCard = !enterprisePlan && isOrgOwnerOrAdmin;

  const rightColumnHasContent =
    showPayingOnDemandCopy || showNonPayingOrgCopy || showContentfulAppsCard;

  // TODO: cleanup after 6 months from v1 migration
  const isV1MigrationSucceeded = organization.sys._v1Migration?.status === 'succeeded';
  const v1migrationDestination = organization.sys._v1Migration?.destination;

  const basePlanName = generateBasePlanName(basePlan, v1migrationDestination);

  return (
    <Grid testId="subscription-page" columns={2} columnGap="spacingXl" rowGap="spacingXl">
      {isV1MigrationSucceeded && basePlanName && (
        <V1MigrationNote basePlanName={basePlanName} className={styles.fullRow} />
      )}
      {organization && isOrgOnTrial && (
        <Flex className={styles.fullRow} flexDirection="column">
          <EnterpriseTrialInfo organization={organization} />
        </Flex>
      )}
      {!isNotAdminOrOwnerOfTrialOrg && (
        <Flex flexDirection="column">
          <BasePlan basePlan={basePlan} />
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
                isOnEnterpriseTrial={isOrgOnTrial}
              />
            </Flex>
          )}
        </Flex>
      )}
      {!isNotAdminOrOwnerOfTrialOrg && (
        <Flex flexDirection="column">
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
                isOnEnterpriseTrial={isOrgOnTrial}
              />
            </Flex>
          )}
          {showPayingOnDemandCopy && (
            <Flex flexDirection="column" marginBottom="spacingXl">
              <PayingOnDemandOrgCopy grandTotal={subscriptionCosts.total} />
            </Flex>
          )}
          {showContentfulAppsCard && (
            <Flex flexDirection="column">
              <ContentfulApps
                organizationId={organizationId}
                startAppTrial={handleStartAppTrial}
                addOnPlan={addOnPlan}
              />
            </Flex>
          )}
          {showNonPayingOrgCopy && (
            <Flex flexDirection="column" marginTop="spacingXl">
              <NonPayingOrgCopy onCreateSpace={onCreateSpace} />
            </Flex>
          )}
        </Flex>
      )}

      <Flex className={styles.fullRow} flexDirection="column">
        {isNotAdminOrOwnerOfTrialOrg ? (
          <SpacesListForMembers spaces={memberAccessibleSpaces} />
        ) : (
          <SpacePlans
            organizationId={organizationId}
            enterprisePlan={enterprisePlan}
            isOwnerOrAdmin={isOrgOwnerOrAdmin}
          />
        )}
      </Flex>
    </Grid>
  );
}

SubscriptionPage.propTypes = {
  basePlan: PropTypes.object,
  addOnPlan: PropTypes.object,
  usersMeta: PropTypes.object,
  organization: PropTypes.object,
  memberAccessibleSpaces: PropTypes.array,
};

SubscriptionPage.defaultProps = {
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

function NonPayingOrgCopy({ onCreateSpace }) {
  return (
    <Typography testId="subscription-page.non-paying-org-limits">
      <Heading className="section-title">Your organization limits</Heading>
      <Paragraph>
        Your organization is currently limited to 5 users, 50MB per asset in your space, and no API
        overages. Add a paid space to remove these limits.
      </Paragraph>
      <TextLink
        icon="PlusCircle"
        testId="subscription-page.add-space-free-org-cta"
        onClick={onCreateSpace}>
        Create a space
      </TextLink>
    </Typography>
  );
}

NonPayingOrgCopy.propTypes = {
  onCreateSpace: PropTypes.func.isRequired,
};
