import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import moment from 'moment';

import { Tag } from '@contentful/forma-36-react-components';
import { scheduleStyles as styles } from './styles.es6';

const FormattedTime = time => (
  <span className={styles.date}>
    {moment
      .utc(time)
      .local()
      .format('ddd, MMM Do, YYYY - hh:mm A')}
  </span>
);
const tagTypeForStatus = {
  pending: 'warning',
  success: 'positive',
  error: 'negative',
  cancelled: 'muted'
};

const Job = ({ scheduledAt, actionType, status }) => (
  <li className={styles.schedule}>
    <span className={styles.scheduledTo}>Scheduled to</span>
    <span className={styles.info}>
      <Tag
        className={cn(styles.actionType)}
        tagType={tagTypeForStatus[status]}
        testId="scheduled-item">
        {actionType}
      </Tag>
      {FormattedTime(scheduledAt)}
    </span>
  </li>
);

export const propTypes = {
  scheduledAt: PropTypes.instanceOf(Date),
  actionType: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'cancelled', 'success', 'error'])
};
Job.propTypes = propTypes;

export default Job;
