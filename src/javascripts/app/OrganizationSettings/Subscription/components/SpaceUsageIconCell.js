import React from 'react';
import PropTypes from 'prop-types';
import { Icon, TableCell, Tooltip } from '@contentful/forma-36-react-components';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';
import { utilizationState } from '../utils';

const styles = {
  cell: css({
    padding: 0,
    paddingTop: tokens.spacingM,
    lineHeight: 'initial',
  }),
  warning: css({
    color: tokens.colorWarning,
  }),
  negative: css({
    color: tokens.colorNegative,
  }),
};

const trackClickEvent = (eventName) => () => {
  track(`space_usage_summary:${eventName}`);
};

const iconAndTooltipContent = ({ state, percentage }) => {
  switch (state) {
    case 'APPROACHING': {
      return {
        icon: {
          color: 'warning',
          icon: 'Warning',
        },
        label: `Approaching limit (${percentage}%)`,
      };
    }
    case 'REACHED': {
      return {
        icon: {
          color: 'warning',
          icon: 'Warning',
        },
        label: 'Reached limit (100%)',
      };
    }
    case 'EXCEEDED': {
      return {
        icon: {
          color: 'negative',
          icon: 'InfoCircle',
        },
        label: `Exceeding limit (${percentage}%)`,
      };
    }
    default: {
      return {};
    }
  }
};

export const SpaceUsageIconCell = ({
  usage,
  utilization,
  limit,
  testId = 'subscription-page.spaces-list.usage-icon',
}) => {
  const { state, percentage } = utilizationState({ usage, limit, utilization });
  const { icon, label } = iconAndTooltipContent({ state, percentage });
  return (
    <TableCell
      testId={testId}
      className={cx({
        [styles.cell]: true,
        [styles.warning]: ['APPROACHING', 'REACHED'].includes(state),
        [styles.negative]: ['EXCEEDED'].includes(state),
      })}>
      {['APPROACHING', 'REACHED', 'EXCEEDED'].includes(state) && (
        <Tooltip
          content={label}
          onMouseOver={trackClickEvent('usage_tooltip_hovered')}
          testId="subscription-page.spaces-list.usage-tooltip">
          <Icon testId="subscription-page.spaces-list.usage-tooltip-trigger" {...icon} />
        </Tooltip>
      )}
    </TableCell>
  );
};

SpaceUsageIconCell.propTypes = {
  limit: PropTypes.number.isRequired,
  utilization: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
  testId: PropTypes.string,
};
