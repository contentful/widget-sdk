import React from 'react';
import PropTypes from 'prop-types';
import { Icon, TableCell, Tooltip } from '@contentful/forma-36-react-components';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  icon: css({
    marginTop: `-${tokens.spacing2Xs}`,
    verticalAlign: 'middle',
    cursor: 'help',
  }),
  usageWarning: css({
    color: tokens.colorWarning,
  }),
  usageNegative: css({
    color: tokens.colorNegative,
  }),
};

export const SpaceUsageTableCell = ({ usage, limit }) => {
  const percentage = Math.round((usage / limit) * 100);
  let label;
  let icon;
  if (percentage > 100) {
    label = `Exceeding limit (${percentage}%)`;
    icon = {
      color: 'negative',
      icon: 'InfoCircle',
    };
  } else if (percentage > 80) {
    icon = {
      color: 'warning',
      icon: 'Warning',
    };
    label = `Aproaching limit (${percentage}%)`;
  }

  return (
    <TableCell
      testId="subscription-page.spaces-list.created-by"
      className={cx({
        [styles.usageNegative]: icon?.color === 'negative',
        [styles.usageWarning]: icon?.color === 'warning',
      })}>
      {usage}/{limit}&nbsp;
      {percentage > 80 && (
        <Tooltip content={label}>
          <Icon className={styles.icon} {...icon} />
        </Tooltip>
      )}
    </TableCell>
  );
};

SpaceUsageTableCell.propTypes = {
  limit: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
};
