import React from 'react';
import PropTypes from 'prop-types';
import { Icon, TableCell, Tooltip } from '@contentful/forma-36-react-components';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';

const styles = {
  icon: css({
    marginTop: `-${tokens.spacing2Xs}`,
    verticalAlign: 'middle',
  }),
  usageWarning: css({
    color: tokens.colorWarning,
  }),
  usageNegative: css({
    color: tokens.colorNegative,
  }),
  usageEmphasized: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

const trackClickEvent = (eventName) => () => {
  track(`space_usage_summary:${eventName}`);
};

const UTILIZATION_THRESHOLD = 80;

export const SpaceUsageTableCell = ({ usage, utilization, limit, testId }) => {
  const percentage = Math.round(utilization * 100);
  const lowLimitResource = limit < 5 && limit - usage === 1;
  const approachingLimit = percentage >= UTILIZATION_THRESHOLD || lowLimitResource;
  let label;
  let icon;

  if (percentage > 100) {
    label = `Exceeding limit (${percentage}%)`;
    icon = {
      color: 'negative',
      icon: 'InfoCircle',
    };
  } else if (approachingLimit) {
    icon = {
      color: 'warning',
      icon: 'Warning',
    };
    label = percentage === 100 ? 'Reached limit (100%)' : `Approaching limit (${percentage}%)`;
  }

  return (
    <TableCell
      testId={testId ?? 'subscription-page.spaces-list.usage'}
      className={cx({
        [styles.usageNegative]: icon?.color === 'negative',
        [styles.usageWarning]: icon?.color === 'warning',
      })}>
      {approachingLimit && (
        <Tooltip
          content={<div>{label}</div>}
          onMouseOver={trackClickEvent('usage_tooltip_hovered')}
          testId="subscription-page.spaces-list.usage-tooltip">
          <Icon
            className={styles.icon}
            testId="subscription-page.spaces-list.usage-tooltip-trigger"
            {...icon}
          />
        </Tooltip>
      )}{' '}
      <span className={cx({ [styles.usageEmphasized]: approachingLimit })}>{usage}</span>/{limit}
    </TableCell>
  );
};

SpaceUsageTableCell.propTypes = {
  limit: PropTypes.number.isRequired,
  utilization: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
  testId: PropTypes.string,
};
