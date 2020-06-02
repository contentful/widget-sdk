import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get } from 'lodash';
import { isOwner } from 'services/OrganizationRoles';
import { Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';

import SpacePlanItem from './SpacePlanItem';
import BillingInfo from './BillingInfo';
import NoMorePlans from './NoMorePlans';

import { getHighestPlan } from '../shared/utils';

const styles = {
  center: css({
    textAlign: 'center',
  }),
  container: css({
    padding: '20px',
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
  } = props;

  const highestPlan = getHighestPlan(spaceRatePlans);

  const atHighestPlan =
    highestPlan.unavailabilityReasons &&
    highestPlan.unavailabilityReasons.some(({ type }) => type === 'currentPlan');
  const payingOrg = organization.isBillable;

  // TODO: add this logic when refactor the change space wizard
  // const recommendedPlan = isChangingInSpace && getRecommendedPlan(spaceRatePlans, resources)

  return (
    <div className={styles.container}>
      <Typography>
        {!payingOrg && (
          <BillingInfo canSetupBilling={isOwner(organization)} goToBilling={goToBillingPage} />
        )}
        {atHighestPlan && <NoMorePlans canSetupBilling={isOwner(organization)} />}

        <Heading className={styles.center}>Choose the space type</Heading>
        <Paragraph className={styles.center}>
          You are creating this space for the organization <em>{organization.name}</em>.
        </Paragraph>
        {spaceRatePlans.map((plan) => (
          <SpacePlanItem
            key={plan.sys.id}
            plan={plan}
            freeSpacesResource={freeSpacesResource}
            isPayingOrg={payingOrg}
            isSelected={get(selectedPlan, 'sys.id') === plan.sys.id}
            onSelect={onSelectPlan}
          />
        ))}
      </Typography>
    </div>
  );
}

SpacePlanSelector.propTypes = {
  organization: PropTypes.object.isRequired,
  spaceRatePlans: PropTypes.array.isRequired,
  freeSpacesResource: PropTypes.object.isRequired,
  onSelectPlan: PropTypes.func.isRequired,
  selectedPlan: PropTypes.object,
  goToBillingPage: PropTypes.func.isRequired,
};
