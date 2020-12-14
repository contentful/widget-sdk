import React from 'react';
import PropTypes from 'prop-types';
import {
  Plan as PlanPropType,
  Resource as ResourcePropType,
} from 'app/OrganizationSettings/PropTypes';
import { List, ListItem, Icon, Tooltip } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { getIncludedResources, resourcesToDisplay, getTooltip } from '../utils/utils';
import { getRolesTooltip } from 'utils/RoleTooltipCopy';
import { shorten } from 'utils/NumberUtils';

const styles = {
  listItem: css({
    marginBottom: tokens.spacingS,
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'max-content',
    columnGap: tokens.spacingS,
    alignItems: 'center',
    ':last-child': {
      marginBottom: 0,
    },
  }),
  tooltipPointer: css({ cursor: 'pointer' }),
};

export function SpacePlanResourceList({ plan, spaceResources }) {
  const resources = getIncludedResources(plan.ratePlanCharges ?? plan.productRatePlanCharges);

  const getListItem = (name, id) => {
    if (spaceResources) {
      let usage = spaceResources[id].usage;
      // Add "extra" environment and role to include `master` and `admin`
      if (['environment', 'role'].includes(id)) {
        usage = usage + 1;
      }

      return (
        <ListItem key={id} className={styles.listItem}>
          <Icon icon="CheckCircle" color="muted" />
          <span>
            Using {shorten(usage)} of {shorten(resources[id])} {name}
          </span>
        </ListItem>
      );
    }

    let tooltipText = '';
    // get tooltips texts for env, records and role
    ['role'].includes(id)
      ? (tooltipText = getRolesTooltip(resources[id], plan.roleSet))
      : (tooltipText = getTooltip(id, resources[id]));

    return (
      <ListItem key={id} className={styles.listItem}>
        <Icon icon="CheckCircle" color="positive" className={styles.icon} />{' '}
        <Tooltip place="top" content={tooltipText}>
          <span className={tooltipText && styles.tooltipPointer}>
            {shorten(resources[id])} {name}
          </span>
        </Tooltip>
      </ListItem>
    );
  };

  return <List>{resourcesToDisplay.map(({ name, id }) => getListItem(name, id))}</List>;
}

SpacePlanResourceList.propTypes = {
  plan: PlanPropType.isRequired,
  spaceResources: PropTypes.objectOf(ResourcePropType),
};
