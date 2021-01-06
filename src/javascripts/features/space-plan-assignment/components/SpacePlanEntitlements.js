import React from 'react';

import { Plan as PlanPropType } from 'app/OrganizationSettings/PropTypes';
import { css } from 'emotion';
import { Tooltip } from '@contentful/forma-36-react-components';
import { resourcesToDisplay, getIncludedResources, getTooltip } from '../utils/utils';
import { getRolesTooltip } from 'utils/RoleTooltipCopy';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import { shorten } from 'utils/NumberUtils';

const styles = {
  flexItem: css({ marginRight: '2.25rem' }),
  tooltipPointer: css({ cursor: 'help' }),
  wrapper: css({ marginLeft: '2.4rem' }),
};

export function SpacePlanEntitlements({ plan }) {
  // what's defined in the new plan
  const charges = plan.ratePlanCharges ?? plan.productRatePlanCharges;
  const planResources = getIncludedResources(charges);
  return (
    <Flex justifyContent="flex-start" className={styles.wrapper} testId="space-plan-entitlements">
      {resourcesToDisplay.map(({ id, name }) => {
        let tooltipText = '';
        // get tooltips texts for env, records and role
        ['role'].includes(id)
          ? (tooltipText = getRolesTooltip(planResources[id], plan.roleSet))
          : (tooltipText = getTooltip(id, planResources[id]));

        return (
          <Flex key={id} className={styles.flexItem}>
            <span className={tooltipText && styles.tooltipPointer}>
              {shorten(planResources[id])}{' '}
              <Tooltip place="right" content={tooltipText}>
                {name}
              </Tooltip>
            </span>
          </Flex>
        );
      })}
    </Flex>
  );
}

SpacePlanEntitlements.propTypes = {
  plan: PlanPropType.isRequired,
};
