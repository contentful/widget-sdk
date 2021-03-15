import React from 'react';
import PropTypes from 'prop-types';
import {
  Space as SpacePropType,
  Plan as PlanPropType,
  Resource as ResourcePropType,
} from 'app/OrganizationSettings/PropTypes';
import {
  Typography,
  Heading,
  List,
  ListItem,
  Subheading,
  Note,
} from '@contentful/forma-36-react-components';
import { Pluralized } from 'core/components/formatting';
import { groupPlans, buildPlanKey, orderPlanKeys, ASSIGNMENT_FLOW_TYPE } from '../utils/utils';
import { CREATION_FLOW_TYPE } from 'features/space-creation';
import { SpacePlanCard } from './SpacePlanCard';
import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

export function SpacePlanSelection({
  plans,
  productRatePlans,
  space,
  spaceResources,
  currentPlan,
  selectedPlan,
  onPlanSelected,
  flowType,
  freeSpaceResource,
}) {
  const isCreationFlow = flowType === CREATION_FLOW_TYPE;
  const groupedPlans = groupPlans(plans);
  const currentRatePlanKey = currentPlan?.ratePlanCharges
    ? buildPlanKey(currentPlan.name, currentPlan.ratePlanCharges)
    : null;
  const defaultRatePlanKeys = productRatePlans.map((plan) =>
    buildPlanKey(plan.name, plan.productRatePlanCharges)
  );
  const orderedPlanKeys = orderPlanKeys(groupedPlans, defaultRatePlanKeys);
  const freePlanCount = freeSpaceResource?.limits?.maximum - freeSpaceResource?.usage;
  const hasOnlyFreePlan = isCreationFlow && plans.length === 1;

  const styles = {
    subheading: css({
      color: tokens.colorTextMid,
      marginTop: tokens.spacingL,
      marginBottom: tokens.spacingXs,
    }),
    listItem: css({ listStyleType: 'none' }),
    note: css({ marginBottom: tokens.spacingM }),
  };

  return (
    <div>
      <Typography>
        {isCreationFlow ? (
          <Heading element="h2">Choose a space type for your new space</Heading>
        ) : (
          <Heading element="h2">
            Choose a new space type for {space?.name}
            {currentPlan?.name && <span> ({currentPlan.name})</span>}
          </Heading>
        )}
      </Typography>
      <List>
        {!hasOnlyFreePlan && <Subheading className={styles.subheading}>Unused spaces</Subheading>}
        {orderedPlanKeys.map((key, index) => {
          // We use the first in the group plan to display the limits
          // Plans with the same name *should* be identical.
          // In the future we may use the `quantity` attribute instead of
          // multiple instances of the same plan.
          const plan = groupedPlans[key][0];
          const isFree = isFreeProductPlan(plan);
          const planCount = isFree ? freePlanCount : groupedPlans[key].length;
          const isCustomPlan = isFree ? false : !defaultRatePlanKeys.includes(key);
          const isSameAsCurrentPlan = currentRatePlanKey && currentRatePlanKey === key;

          return (
            <ListItem key={plan.sys.id} testId="space-plan-item" className={styles.listItem}>
              {isCreationFlow && isFree && (
                <>
                  <Subheading className={styles.subheading}>
                    Test out new projects for 30 days, free of charge.
                  </Subheading>
                  {freePlanCount === 0 && (
                    <Note testId="reached-limit-note" className={styles.note}>
                      You’ve created{' '}
                      <Pluralized text="Trial Space" count={freeSpaceResource?.limits?.maximum} />.
                      Delete an existing one or talk to us if you need more.
                    </Note>
                  )}
                </>
              )}
              <SpacePlanCard
                index={index}
                plan={plan}
                planCount={planCount}
                spaceResources={spaceResources}
                isCustomPlan={isCustomPlan}
                flowType={flowType}
                freeSpaceResource={freeSpaceResource}
                selectedPlan={selectedPlan}
                onPlanSelected={onPlanSelected}
                isSameAsCurrentPlan={isSameAsCurrentPlan}
                spaceName={space?.name}
              />
            </ListItem>
          );
        })}
      </List>
    </div>
  );
}

SpacePlanSelection.propTypes = {
  plans: PropTypes.arrayOf(PlanPropType).isRequired,
  productRatePlans: PropTypes.arrayOf(PlanPropType).isRequired,
  space: SpacePropType,
  spaceResources: PropTypes.objectOf(ResourcePropType),
  selectedPlan: PlanPropType,
  currentPlan: PlanPropType,
  onPlanSelected: PropTypes.func.isRequired,
  flowType: PropTypes.oneOf([CREATION_FLOW_TYPE, ASSIGNMENT_FLOW_TYPE]),
  freeSpaceResource: ResourcePropType,
};
