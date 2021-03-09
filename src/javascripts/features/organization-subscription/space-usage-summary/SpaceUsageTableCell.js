import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import { TableCell, Icon, Tooltip, Flex } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { utils } from '../utils';
import { track } from 'analytics/Analytics';

const styles = {
  tableCellAlignedMiddle: css({
    verticalAlign: 'middle',
  }),
  warning: css({
    color: tokens.colorWarning,
  }),
  negative: css({
    color: tokens.colorNegative,
  }),
  emphasized: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
  iconContainer: css({
    maxHeight: '18px',
  }),
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

const trackClickEvent = (eventName) => () => {
  track(`space_usage_summary:${eventName}`);
};

export const SpaceUsageTableCell = ({
  usage,
  limit,
  utilization,
  testId = 'subscription-page.spaces-list.usage',
}) => {
  const { state, percentage } = utils.utilizationState({ usage, limit, utilization });
  const { icon, label } = iconAndTooltipContent({ state, percentage });

  return (
    <TableCell
      testId={testId}
      className={cx(styles.tableCellAlignedMiddle, {
        [styles.warning]: ['APPROACHING', 'REACHED'].includes(state),
        [styles.negative]: ['EXCEEDED'].includes(state),
      })}>
      <Flex fullWidth justifyContent="flex-start" alignItems="center">
        {icon && (
          <Flex marginRight="spacing2Xs" className={styles.iconContainer}>
            <Tooltip
              content={label}
              onMouseOver={trackClickEvent('usage_tooltip_hovered')}
              testId="subscription-page.spaces-list.usage-tooltip">
              <Icon testId="subscription-page.spaces-list.usage-tooltip-trigger" {...icon} />
            </Tooltip>
          </Flex>
        )}
        <span
          className={cx({
            [styles.emphasized]: ['APPROACHING', 'REACHED', 'EXCEEDED'].includes(state),
          })}>
          {usage}
        </span>
        /{limit}
      </Flex>
    </TableCell>
  );
};

SpaceUsageTableCell.propTypes = {
  limit: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
  utilization: PropTypes.number.isRequired,
  testId: PropTypes.string,
};
