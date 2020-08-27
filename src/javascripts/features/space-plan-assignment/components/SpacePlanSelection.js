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
  List,
  ListItem,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import StateLink from 'app/common/StateLink';
import { SpacePlanComparison } from './SpacePlanComparison';
import { ExpandableElement } from './ExpandableElement';
import { groupBy } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  cardItem: css({
    borderLeft: `8px solid ${tokens.colorElementLight}`, // temporary, we would have it moved into the item to dinamically change color
    marginBottom: tokens.spacingM,
  }),
};

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
      <List>
        {Object.keys(groupedPlans).map((name, index) => {
          const plan = groupedPlans[name][0];
          const planCount = groupedPlans[name].length;
          return (
            <ListItem key={plan.sys.id} testId="space-plan-item">
              <Card padding="large" className={styles.cardItem}>
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
                <ExpandableElement id={index}>
                  <SpacePlanComparison plan={plan} spaceResources={spaceResources} />
                </ExpandableElement>
              </Card>
            </ListItem>
          );
        })}
      </List>
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
