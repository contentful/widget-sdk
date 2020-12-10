import React from 'react';
import PropTypes from 'prop-types';
import {
  Plan as PlanPropType,
  Resource as ResourcePropType,
} from 'app/OrganizationSettings/PropTypes';
import cn from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Card, RadioButton, Tag, Heading } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import { ASSIGNMENT_FLOW_TYPE, canPlanBeAssigned } from '../utils/utils';
import { CREATION_FLOW_TYPE } from 'features/space-creation';
import { SpacePlanEntitlements } from './SpacePlanEntitlements';
import { SpacePlanComparison } from './SpacePlanComparison';
import { ExpandableElement } from './ExpandableElement';

export function SpacePlanCard({
  index,
  plan,
  planCount,
  spaceResources,
  isCustomPlan,
  flowType,
  selectedPlan,
  onPlanSelected,
}) {
  const isDisabled = spaceResources && !canPlanBeAssigned(plan, spaceResources);
  const planColor =
    plan.name === 'Large' || plan.name === 'Medium' ? tokens.colorGreenLight : tokens.colorBlueMid;

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
        backgroundColor: `${planColor}`,
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
    custom: css({
      fontWeight: `${tokens.fontWeightNormal}`,
      color: `${tokens.colorTextLightest}`,
    }),
  };

  return (
    <Card
      testId={`space-plan-card-${index}`}
      padding="large"
      className={cn(styles.cardItem, {
        [styles.cardItemActive]: plan === selectedPlan,
      })}>
      <Flex
        htmlTag="label"
        justifyContent="start"
        alignItems="center"
        marginBottom="spacingM"
        className={cn({
          [styles.disabled]: isDisabled,
        })}>
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
          <Heading element="h3">
            {plan.name} {isCustomPlan && <span className={styles.custom}> (Customized)</span>}
          </Heading>
          <Tag tagType="positive">{planCount} available</Tag>
        </Flex>
      </Flex>
      {flowType === CREATION_FLOW_TYPE ? (
        <SpacePlanEntitlements plan={plan} />
      ) : (
        <ExpandableElement id={index}>
          <SpacePlanComparison plan={plan} spaceResources={spaceResources} />
        </ExpandableElement>
      )}
    </Card>
  );
}

SpacePlanCard.defaultProps = {
  isCustomPlan: false,
};

SpacePlanCard.propTypes = {
  index: PropTypes.number,
  plan: PlanPropType.isRequired,
  planCount: PropTypes.number.isRequired,
  spaceResources: PropTypes.objectOf(ResourcePropType),
  flowType: PropTypes.oneOf([CREATION_FLOW_TYPE, ASSIGNMENT_FLOW_TYPE]),
  isCustomPlan: PropTypes.bool,
  selectedPlan: PlanPropType,
  onPlanSelected: PropTypes.func,
};
