import React from 'react';
import { Tag } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { scheduleStyles as styles } from './styles.es6';
import cn from 'classnames';
import moment from 'moment';

const FormattedTime = time => <span>{moment.utc(time).format('MMM Do YYYY - hh:mm')}</span>;
const tagTypeForStatus = {
  pending: 'warning',
  success: 'positive',
  error: 'negative',
  cancelled: 'muted'
};

const Schedule = ({ scheduledAt, actionType, status }) => (
  <li className={styles.schedule}>
    {FormattedTime(scheduledAt)}
    <Tag className={cn(styles.actionType)} tagType={tagTypeForStatus[status]}>
      {actionType}
    </Tag>
  </li>
);

Schedule.propTypes = {
  scheduledAt: PropTypes.number,
  actionType: PropTypes.string.isRequired,
  status: PropTypes.string
};

export default Schedule;
