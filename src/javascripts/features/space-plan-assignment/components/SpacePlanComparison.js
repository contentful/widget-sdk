import React from 'react';
import PropTypes from 'prop-types';
import {
  Plan as PlanPropType,
  Resource as ResourcePropType,
} from 'app/OrganizationSettings/PropTypes';
import { get } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Icon,
  Tooltip,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import { getResourceLimits } from 'utils/ResourceUtils';

const styles = {
  warning: css({ color: tokens.colorWarning }),
};

const resourcesToDisplay = [
  { id: 'environment', name: 'Environments' },
  { id: 'role', name: 'Roles' },
  { id: 'locale', name: 'Locales' },
  { id: 'content_type', name: 'Content types' },
  { id: 'record', name: 'Records' },
];

export function SpacePlanComparison({ plan, spaceResources }) {
  // what's defined in the new plan
  const planResources = getIncludedResources(plan.ratePlanCharges);
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell />
          <TableCell>Environments</TableCell>
          <TableCell>Roles</TableCell>
          <TableCell>Locales</TableCell>
          <TableCell>Content types</TableCell>
          <TableCell>Records</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow key={'current'}>
          <TableCell>Current space usage</TableCell>
          {resourcesToDisplay.map(({ id }) => {
            const usage = spaceResources[id].usage;
            const limit = getResourceLimits(spaceResources[id]);
            const isOverLimit = usage > limit.maximum;
            return (
              <TableCell key={id} className={isOverLimit ? styles.warning : ''}>
                <Tooltip place="top" content="Your current usage exceeds this plan's limit">
                  <Flex justifyContent="center" alignItems="center">
                    <Flex marginRight="spacing2xs">{usage}</Flex>
                    {isOverLimit && <Icon icon="Warning" color="warning" />}
                  </Flex>
                </Tooltip>
              </TableCell>
            );
          })}
        </TableRow>
        <TableRow key={'new'}>
          <TableCell>{plan.name}</TableCell>
          {resourcesToDisplay.map(({ id }) => (
            <TableCell key={id}>{planResources[id]}</TableCell>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  );
}

SpacePlanComparison.propTypes = {
  plan: PlanPropType.isRequired,
  spaceResources: PropTypes.objectOf(ResourcePropType),
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
