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
  List,
  ListItem,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import StateLink from 'app/common/StateLink';
import { SpacePlanComparison } from './SpacePlanComparison';
import { ExpandableElement } from './ExpandableElement';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { canPlanBeAssigned } from '../utils/utils';

export function SpaceSelection({
  spaces,
  plan,
  spaceResourcesBySpace,
  selectedSpace,
  onSpaceSelected,
  onNext,
}) {
  return (
    <>
      <Typography>
        <Heading element="h2">Choose a new space for {plan.name}</Heading>
      </Typography>
      <List>
        {spaces.map((space, index) => {
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

          const isDisabled = !canPlanBeAssigned(plan, spaceResourcesBySpace[space.sys.id]);
          return (
            <ListItem key={space.sys.id} testId="space-plan-item">
              <Card
                padding="large"
                className={cn(styles.cardItem, {
                  [styles.cardItemActive]: space === selectedSpace,
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
                    checked={space === selectedSpace}
                    onChange={() => onSpaceSelected(space)}
                    labelText={space.name}
                    className={styles.radioButtonLarge}
                  />
                  <Flex
                    marginLeft={'spacingS'}
                    fullWidth={true}
                    justifyContent="space-between"
                    alignItems="center">
                    <Heading element="h3">{space.name}</Heading>
                  </Flex>
                </Flex>
                <ExpandableElement id={index}>
                  <SpacePlanComparison
                    plan={plan}
                    spaceResources={spaceResourcesBySpace[space.sys.id]}
                  />
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

SpaceSelection.propTypes = {
  plan: PlanPropType.isRequired,
  spaces: PropTypes.arrayOf(SpacePropType).isRequired,
  spaceResourcesBySpace: PropTypes.objectOf(ResourcePropType),
  selectedSpace: SpacePropType,
  onSpaceSelected: PropTypes.func.isRequired,
  onNext: PropTypes.func,
};
