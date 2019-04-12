import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import moment from 'moment';

import { Tag } from '@contentful/forma-36-react-components';
import { scheduleStyles as styles } from './styles.es6';

const FormattedTime = time => (
  <span className={styles.date}>{moment.utc(time).format('MMM Do YYYY - hh:mm')}</span>
);
const tagTypeForStatus = {
  pending: 'warning',
  success: 'positive',
  error: 'negative',
  cancelled: 'muted'
};

const Schedule = ({ scheduledAt, actionType, status }) => (
  <li className={styles.schedule}>
    <span>Scheduled to</span>
    <span className={styles.info}>
      <Tag className={cn(styles.actionType)} tagType={tagTypeForStatus[status]}>
        {actionType}
      </Tag>
      {FormattedTime(scheduledAt)}
    </span>
  </li>
);

export const schedulePropTypes = {
  scheduledAt: PropTypes.string.isRequired,
  actionType: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'cancelled', 'success', 'error'])
};
Schedule.propTypes = schedulePropTypes;

export default Schedule;
