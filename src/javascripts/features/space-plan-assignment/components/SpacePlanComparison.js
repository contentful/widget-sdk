import React from 'react';
import PropTypes from 'prop-types';
import {
  Plan as PlanPropType,
  Resource as ResourcePropType,
} from 'app/OrganizationSettings/PropTypes';
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
import { resourcesToDisplay, getIncludedResources } from '../utils/utils';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';

const styles = {
  warning: css({ color: tokens.colorWarning }),
};

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
            let usage = spaceResources[id].usage;
            // Add "extra" environment and role to include `master` and `admin`
            if (['environment', 'role'].includes(id)) {
              usage = usage + 1;
            }
            const isOverLimit = usage > planResources[id];
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
