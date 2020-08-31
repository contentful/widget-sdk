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

export function SpacePlanSelection({
  plans,
  space,
  spaceResources,
  selectedPlan,
  onPlanSelected,
  onNext,
}) {
  const groupedPlans = groupBy(plans, 'name');

  return (
    <Typography>
      <Heading element="h2">Choose a new space type for {space.name}</Heading>
      <List>
        {Object.keys(groupedPlans).map((name, index) => {
          // We use the first in the group plan to display the limits
          // Plans with the same name *should* be identical.
          // In the future we may use the `quantity` attribute instead of
          // multiple instances of the same plan.
          const plan = groupedPlans[name][0];
          const planCount = groupedPlans[name].length;
          const setPlanColor =
            name === 'Large'
              ? tokens.colorGreenLight
              : name === 'Performance 1x'
              ? tokens.colorGreenMid
              : tokens.colorBlueMid;

          const styles = {
            cardItem: css({
              marginBottom: tokens.spacingM,
              borderLeft: `8px solid ${setPlanColor}`,
            }),
          };

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
        <Button buttonType="primary" onClick={onNext}>
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
  onNext: PropTypes.func,
};
