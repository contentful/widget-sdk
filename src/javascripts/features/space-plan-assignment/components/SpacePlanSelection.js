import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import {
  Space as SpacePropType,
  Plan as PlanPropType,
  Resource as ResourcePropType,
} from 'app/OrganizationSettings/PropTypes';
import {
  Typography,
  Heading,
  Card,
  List,
  ListItem,
  Button,
  RadioButton,
} from '@contentful/forma-36-react-components';
import { getResourceLimits } from 'utils/ResourceUtils';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';

const resourcesToDisplay = [
  { id: 'environment', name: 'Environments' },
  { id: 'role', name: 'Roles' },
  { id: 'locale', name: 'Locales' },
  { id: 'content_type', name: 'Content types' },
  { id: 'record', name: 'Records' },
];

export function SpacePlanSelection({ plans, space, spaceResources, selectedPlan, onPlanSelected }) {
  return (
    <Typography>
      <Heading element="h2">Choose a new space type for {space.name}</Heading>
      {plans.map((plan) => {
        // what's defined in the new plan
        const planResources = getIncludedResources(plan.ratePlanCharges);
        return (
          <Card key={plan.sys.id}>
            <Flex htmlTag="label" justifyContent="start" alignItems="center">
              <RadioButton
                checked={plan === selectedPlan}
                onChange={() => onPlanSelected(plan)}
                labelText={plan.name}
              />
              <Heading element="h3">{plan.name}</Heading>
            </Flex>
            <List>
              {resourcesToDisplay.map(({ id, name }) => {
                // what's defined in the current plan + usage
                const spaceResource = spaceResources[id];
                const limit = getResourceLimits(spaceResource);
                return (
                  <ListItem key={id}>
                    <strong>{name}:</strong> {spaceResource.usage}/{limit.maximum}{' '}
                    <strong>New plan:</strong> {planResources[id]}
                  </ListItem>
                );
              })}
            </List>
          </Card>
        );
      })}

      <Flex justifyContent="space-between" alignItems="center" marginTop="spacingL">
        <Button buttonType="muted" onClick={() => {}}>
          Go back
        </Button>
        <Button buttonType="primary" onClick={() => {}}>
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
};

export function getIncludedResources(charges) {
  return Object.values(resourcesToDisplay).reduce((memo, { id, name }) => {
    const charge = charges.find((charge) => charge.name === name);
    let number = get(charge, 'tiers[0].endingUnit');

    // Add "extra" environment and role to include `master` and `admin`
    if (['Environments', 'Roles'].includes(name)) {
      number = number + 1;
    }

    memo[id] = number;
    return memo;
  }, {});
}
