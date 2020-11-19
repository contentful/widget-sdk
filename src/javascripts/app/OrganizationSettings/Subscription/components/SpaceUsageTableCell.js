import React from 'react';
import PropTypes from 'prop-types';
import { Icon, TableCell, Tooltip } from '@contentful/forma-36-react-components';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

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

export const SpaceUsageTableCell = ({ usage, limit, testId }) => {
  const percentage = Math.round((usage / limit) * 100);
  let label;
  let icon;
  if (percentage > 100) {
    label = `Exceeding limit (${percentage}%)`;
    icon = {
      color: 'negative',
      icon: 'InfoCircle',
    };
  } else if (percentage >= 80) {
    icon = {
      color: 'warning',
      icon: 'Warning',
    };
    label = `Approaching limit (${percentage}%)`;
  }

  return (
    <TableCell
      testId={testId ?? 'subscription-page.spaces-list.usage'}
      className={cx({
        [styles.usageNegative]: icon?.color === 'negative',
        [styles.usageWarning]: icon?.color === 'warning',
      })}>
      <span className={cx({ [styles.usageEmphasized]: percentage >= 80 })}>{usage}</span>/{limit}
      &nbsp;
      {percentage > 80 && (
        <Tooltip content={label} testId="subscription-page.spaces-list.usage-tooltip">
          <Icon
            className={styles.icon}
            {...icon}
            testId="subscription-page.spaces-list.usage-tooltip-trigger"
          />
        </Tooltip>
      )}
    </TableCell>
  );
};

SpaceUsageTableCell.propTypes = {
  limit: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
  testId: PropTypes.string,
};
