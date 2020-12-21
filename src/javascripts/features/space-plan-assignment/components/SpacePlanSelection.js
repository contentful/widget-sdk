import React from 'react';
import PropTypes from 'prop-types';
import {
  Space as SpacePropType,
  Plan as PlanPropType,
  Resource as ResourcePropType,
} from 'app/OrganizationSettings/PropTypes';
import { salesUrl } from 'Config';
import {
  Typography,
  Heading,
  Button,
  List,
  ListItem,
  Subheading,
  TextLink,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import StateLink from 'app/common/StateLink';
import { groupPlans, buildPlanKey, orderPlanKeys, ASSIGNMENT_FLOW_TYPE } from '../utils/utils';
import { CREATION_FLOW_TYPE } from 'features/space-creation';
import { SpacePlanCard } from './SpacePlanCard';
import { isFreeProductPlan } from 'account/pricing/PricingDataProvider';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import * as Intercom from 'services/intercom';

export function SpacePlanSelection({
  plans,
  ratePlans,
  space,
  spaceResources,
  currentPlanName,
  selectedPlan,
  onPlanSelected,
  onNext,
  flowType,
  freeSpaceResource,
}) {
  const isCreationFlow = flowType === CREATION_FLOW_TYPE;
  const groupedPlans = groupPlans(plans);
  const defaultRatePlanKeys = ratePlans.map((plan) =>
    buildPlanKey(plan.name, plan.productRatePlanCharges)
  );
  const orderedPlanKeys = orderPlanKeys(groupedPlans, defaultRatePlanKeys);
  const freePlanCount = freeSpaceResource?.limits?.maximum - freeSpaceResource?.usage;

  const handleGetInTouchClick = () => {
    // TODO add tracking
    if (Intercom.isEnabled()) {
      Intercom.open();
    } else {
      window.open(salesUrl);
    }
  };

  const styles = {
    subheading: css({
      color: tokens.colorTextMid,
      marginTop: tokens.spacingL,
      marginBottom: tokens.spacingXs,
    }),
    listItem: css({ listStyleType: 'none' }),
  };

  return (
    <div>
      <Typography>
        {isCreationFlow ? (
          <Heading element="h2">Choose a space type for your new space</Heading>
        ) : (
          <Heading element="h2">
            Choose a new space type for {space?.name}
            {currentPlanName && <span>({currentPlanName})</span>}
          </Heading>
        )}
      </Typography>
      <List>
        {isCreationFlow && (
          <Subheading className={styles.subheading}>
            Select from the ones you’re not using yet.
          </Subheading>
        )}
        {orderedPlanKeys.map((key, index) => {
          // We use the first in the group plan to display the limits
          // Plans with the same name *should* be identical.
          // In the future we may use the `quantity` attribute instead of
          // multiple instances of the same plan.
          const plan = groupedPlans[key][0];
          const isFree = isFreeProductPlan(plan);
          const planCount = isFree ? freePlanCount : groupedPlans[key].length;
          const isCustomPlan = isFree ? false : !defaultRatePlanKeys.includes(key);

          return (
            <ListItem key={plan.sys.id} testId="space-plan-item" className={styles.listItem}>
              {isCreationFlow && isFree && (
                <Subheading className={styles.subheading}>
                  Test out new projects for 30 days, free of charge.
                </Subheading>
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
              />
            </ListItem>
          );
        })}
      </List>
      <Flex justifyContent="space-between" alignItems="center">
        {isCreationFlow && (
          <TextLink onClick={handleGetInTouchClick}>
            Get in touch if you need something more
          </TextLink>
        )}
        <Flex justifyContent="flex-end" alignItems="center" flexGrow="1">
          <StateLink
            testId="go-back-btn"
            component={Button}
            buttonType="muted"
            path={'^'}
            trackingEvent={'space_assignment:back'}
            trackParams={{
              space_id: space?.sys.id,
              // TODO change flow id for create
              flow: 'assing_plan_to_space',
            }}>
            Back
          </StateLink>
          <Flex marginLeft="spacingM">
            <Button
              buttonType="primary"
              onClick={onNext}
              testId="continue-btn"
              disabled={!selectedPlan}>
              Continue
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </div>
  );
}

SpacePlanSelection.propTypes = {
  plans: PropTypes.arrayOf(PlanPropType).isRequired,
  ratePlans: PropTypes.arrayOf(PlanPropType).isRequired,
  space: SpacePropType,
  spaceResources: PropTypes.objectOf(ResourcePropType),
  selectedPlan: PlanPropType,
  currentPlanName: PropTypes.string,
  onPlanSelected: PropTypes.func.isRequired,
  onNext: PropTypes.func,
  flowType: PropTypes.oneOf([CREATION_FLOW_TYPE, ASSIGNMENT_FLOW_TYPE]),
  freeSpaceResource: ResourcePropType,
};
