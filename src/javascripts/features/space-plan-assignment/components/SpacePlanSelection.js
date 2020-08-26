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
  Card,
  Button,
  RadioButton,
  Tag,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import StateLink from 'app/common/StateLink';
import { SpacePlanComparison } from './SpacePlanComparison';
import { groupBy } from 'lodash';

export function SpacePlanSelection({
  plans,
  space,
  spaceResources,
  selectedPlan,
  onPlanSelected,
  handleNavigationNext,
}) {
  const groupedPlans = groupBy(plans, (p) => p.name);
  return (
    <Typography>
      <Heading element="h2">Choose a new space type for {space.name}</Heading>
      {Object.keys(groupedPlans).map((name) => {
        const plan = groupedPlans[name][0];
        const planCount = groupedPlans[name].length;
        return (
          <Card key={plan.sys.id} testId="space-plan-item">
            <Flex htmlTag="label" justifyContent="start" alignItems="baseline">
              <RadioButton
                checked={plan === selectedPlan}
                onChange={() => onPlanSelected(plan)}
                labelText={plan.name}
              />
              <Flex
                marginLeft={'spacingS'}
                fullWidth={true}
                justifyContent="space-between"
                alignItems="baseline">
                <Heading element="h3">{plan.name}</Heading>
                <Tag tagType="positive">{planCount} available</Tag>
              </Flex>
            </Flex>
            <SpacePlanComparison plan={plan} spaceResources={spaceResources} />
          </Card>
        );
      })}

      <Flex justifyContent="space-between" alignItems="center" marginTop="spacingL">
        <StateLink component={Button} buttonType="muted" path={'^.subscription_new'}>
          Go back
        </StateLink>
        <Button buttonType="primary" onClick={() => handleNavigationNext()}>
          Continue
        </Button>
      </Flex>
    </Typography>
  );
}

SpacePlanSelection.propTypes = {
  plans: PropTypes.arrayOf(PlanPropType).isRequired,
  space: SpacePropType.isRequired,
  spaceResources: PropTypes.objectOf(ResourcePropType),
  selectedPlan: PlanPropType,
  onPlanSelected: PropTypes.func.isRequired,
  handleNavigationNext: PropTypes.func,
};
