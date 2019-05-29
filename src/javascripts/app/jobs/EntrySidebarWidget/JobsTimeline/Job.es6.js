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
const tagTypeForAction = {
  publish: 'positive'
};

const Job = ({ scheduledAt, action }) => (
  <li className={styles.schedule}>
    {FormattedTime(scheduledAt)}
    <span className={styles.info}>
      <Tag
        className={cn(styles.actionType)}
        tagType={tagTypeForAction[action]}
        testId="scheduled-item">
        {action}
      </Tag>
    </span>
  </li>
);

export const propTypes = {
  scheduledAt: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'cancelled', 'success', 'error'])
};
Job.propTypes = propTypes;

export default Job;
