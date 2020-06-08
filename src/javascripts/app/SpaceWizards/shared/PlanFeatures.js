import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { getTooltip, SpaceResourceTypes, getRolesTooltip } from './utils';
import pluralize from 'pluralize';
import { toLocaleString } from 'utils/NumberUtils';
import { Tooltip, List, ListItem } from '@contentful/forma-36-react-components';

const styles = {
  underline: css({
    textDecoration: 'underline',
  }),
};

export default function PlanFeatures({ resources, roleSet, disabled }) {
  return (
    <List className="space-plans-list__item__features" testId="plan-features">
      {resources.map(({ type, number }) => {
        let tooltipText = '';

        if (!disabled) {
          tooltipText =
            type === SpaceResourceTypes.Roles
              ? getRolesTooltip(number, roleSet)
              : getTooltip(type, number);
        }

        return (
          <ListItem testId="resource" key={type}>
            {toLocaleString(number) + ' '}
            {tooltipText && (
              <Tooltip content={tooltipText}>
                <span className={!disabled && styles.underline}>{pluralize(type, number)}</span>
              </Tooltip>
            )}
            {!tooltipText && pluralize(type, number)}
          </ListItem>
        );
      })}
    </List>
  );
}
PlanFeatures.propTypes = {
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      number: PropTypes.number.isRequired,
    })
  ),
  roleSet: PropTypes.shape({
    name: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  disabled: PropTypes.bool,
};
