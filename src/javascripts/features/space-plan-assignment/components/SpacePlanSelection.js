import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
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
import { canPlanBeAssigned } from '../utils/utils';

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
    <>
      <Typography>
        <Heading element="h2">Choose a new space type for {space.name}</Heading>
      </Typography>
      <List>
        {Object.keys(groupedPlans).map((name, index) => {
          // We use the first in the group plan to display the limits
          // Plans with the same name *should* be identical.
          // In the future we may use the `quantity` attribute instead of
          // multiple instances of the same plan.
          const plan = groupedPlans[name][0];
          const planCount = groupedPlans[name].length;
          const setPlanColor =
            name === 'Large' || name === 'Medium' ? tokens.colorGreenLight : tokens.colorBlueMid;

          const styles = {
            cardItem: css({
              marginBottom: tokens.spacingM,
              position: 'relative',

              '&:before': css({
                content: '""',
                position: 'absolute',
                top: '0',
                left: '0',
                width: '8px',
                height: '100%',
                backgroundColor: `${setPlanColor}`,
              }),
            }),
            cardItemActive: css({
              outline: 'none',
              border: `1px solid ${tokens.colorPrimary}`,
              boxShadow: `${tokens.glowPrimary}`,
            }),
            radioButtonLarge: css({
              // TODO: as soon as it goes to prod permanently, move large radio to F36
              width: '18px', // basic size of icon
              height: '18px', // basic size of icon
            }),
            disabled: css({ opacity: 0.5 }),
          };

          const isDisabled = !canPlanBeAssigned(plan, spaceResources);
          return (
            <ListItem key={plan.sys.id} testId="space-plan-item">
              <Card
                padding="large"
                className={cn(styles.cardItem, {
                  [styles.cardItemActive]: plan === selectedPlan,
                  [styles.disabled]: isDisabled,
                })}>
                <Flex
                  htmlTag="label"
                  justifyContent="start"
                  alignItems="center"
                  marginBottom="spacingM">
                  <RadioButton
                    disabled={isDisabled}
                    checked={plan === selectedPlan}
                    onChange={() => onPlanSelected(plan)}
                    labelText={plan.name}
                    className={styles.radioButtonLarge}
                  />
                  <Flex
                    marginLeft={'spacingS'}
                    fullWidth={true}
                    justifyContent="space-between"
                    alignItems="center">
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
        <StateLink
          component={Button}
          buttonType="muted"
          path={'^.subscription_new'}
          icon="ChevronLeft">
          Go back
        </StateLink>
        <Button buttonType="primary" onClick={onNext}>
          Continue
        </Button>
      </Flex>
    </>
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
