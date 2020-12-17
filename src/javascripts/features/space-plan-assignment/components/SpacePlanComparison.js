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
import { resourcesToDisplay, getIncludedResources, getTooltip } from '../utils/utils';
import { getRolesTooltip } from 'utils/RoleTooltipCopy';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';

const styles = {
  warning: css({ color: tokens.colorWarning }),
  tooltipPointer: css({ cursor: 'help' }),
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
            // we don't warn about roles being over the limit
            const isOverLimit = id !== 'role' && usage > planResources[id];
            return (
              <TableCell key={id} className={isOverLimit ? styles.warning : ''}>
                {isOverLimit ? (
                  <Tooltip
                    place="right"
                    content="Your current usage exceeds this space type's limit">
                    <Flex justifyContent="left" alignItems="center">
                      <Flex marginRight="spacing2Xs">{usage}</Flex>
                      <Icon icon="Warning" color="warning" />
                    </Flex>
                  </Tooltip>
                ) : (
                  <Flex justifyContent="left" alignItems="center">
                    <Flex marginRight="spacing2Xs">{usage}</Flex>
                  </Flex>
                )}
              </TableCell>
            );
          })}
        </TableRow>
        <TableRow key={'new'}>
          <TableCell>{plan.name}</TableCell>
          {resourcesToDisplay.map(({ id }) => {
            let tooltipText = '';
            // get tooltips texts for env, records and role
            ['role'].includes(id)
              ? (tooltipText = getRolesTooltip(planResources[id], plan.roleSet))
              : (tooltipText = getTooltip(id, planResources[id]));

            return (
              <TableCell key={id}>
                <Tooltip place="right" content={tooltipText}>
                  <span className={tooltipText && styles.tooltipPointer}>{planResources[id]}</span>
                </Tooltip>
              </TableCell>
            );
          })}
        </TableRow>
      </TableBody>
    </Table>
  );
}

SpacePlanComparison.propTypes = {
  plan: PlanPropType.isRequired,
  spaceResources: PropTypes.objectOf(ResourcePropType),
};
