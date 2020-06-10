import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get } from 'lodash';
import { isOwner } from 'services/OrganizationRoles';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import SpacePlanItem from './SpacePlanItem';
import BillingInfo from './BillingInfo';
import NoMorePlans from './NoMorePlans';

import { getHighestPlan } from '../shared/utils';

const styles = {
  textCenter: css({
    textAlign: 'center',
  }),
  marginBottom: css({
    marginBottom: tokens.spacingM,
  }),
  container: css({
    margin: `0 ${tokens.spacingL}`,
  }),
};

export default function SpacePlanSelector(props) {
  const {
    organization,
    spaceRatePlans,
    freeSpacesResource,
    selectedPlan,
    goToBillingPage,
    onSelectPlan,
    isCommunityPlanEnabled,
  } = props;

  const highestPlan = getHighestPlan(spaceRatePlans);

  const atHighestPlan =
    highestPlan &&
    highestPlan.unavailabilityReasons &&
    highestPlan.unavailabilityReasons.some(({ type }) => type === 'currentPlan');
  const payingOrg = !!organization.isBillable;

  // TODO: add this logic when refactor the change space wizard
  // const recommendedPlan = isChangingInSpace && getRecommendedPlan(spaceRatePlans, resources)

  return (
    <div data-test-id="space-plan-selector" className={styles.container}>
      <Typography>
        <Heading className={styles.textCenter}>Choose the space type</Heading>

        <Paragraph className={styles.textCenter}>
          You are creating this space for the organization {organization.name}.
        </Paragraph>

        {atHighestPlan && (
          <div className={styles.marginBottom}>
            <NoMorePlans canSetupBilling={isOwner(organization)} />
          </div>
        )}

        {!payingOrg && (
          <div className={styles.marginBottom}>
            <BillingInfo goToBilling={goToBillingPage} canSetupBilling={isOwner(organization)} />
          </div>
        )}

        {spaceRatePlans.map((plan) => (
          <SpacePlanItem
            key={plan.sys.id}
            plan={plan}
            freeSpacesResource={freeSpacesResource}
            isPayingOrg={payingOrg}
            isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
            onSelect={onSelectPlan}
            isCommunityPlanEnabled={isCommunityPlanEnabled}
          />
        ))}
      </Typography>
    </div>
  );
}

SpacePlanSelector.propTypes = {
  organization: PropTypes.object.isRequired,
  spaceRatePlans: PropTypes.array.isRequired,
  freeSpacesResource: PropTypes.object,
  onSelectPlan: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
  goToBillingPage: PropTypes.func.isRequired,
  isCommunityPlanEnabled: PropTypes.bool,
};
