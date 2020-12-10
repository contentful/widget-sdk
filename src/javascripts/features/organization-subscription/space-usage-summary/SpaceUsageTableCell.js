import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import { TableCell } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { utils } from '../utils';

const styles = {
  warning: css({
    color: tokens.colorWarning,
  }),
  negative: css({
    color: tokens.colorNegative,
  }),
  emphasized: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

export const SpaceUsageTableCell = ({
  usage,
  limit,
  utilization,
  testId = 'subscription-page.spaces-list.usage',
}) => {
  const { state } = utils.utilizationState({ usage, limit, utilization });

  return (
    <TableCell
      testId={testId}
      className={cx({
        [styles.warning]: ['APPROACHING', 'REACHED'].includes(state),
        [styles.negative]: ['EXCEEDED'].includes(state),
      })}>
      <span
        className={cx({
          [styles.emphasized]: ['APPROACHING', 'REACHED', 'EXCEEDED'].includes(state),
        })}>
        {usage}
      </span>
      /{limit}
    </TableCell>
  );
};

SpaceUsageTableCell.propTypes = {
  limit: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
  utilization: PropTypes.number.isRequired,
  testId: PropTypes.string,
};
