import React from 'react';
import PropTypes from 'prop-types';

import { Tag } from '@contentful/forma-36-react-components';
import { scheduleStyles as styles } from './styles';

const tagTypeForStatus = {
  draft: 'warning',
  published: 'positive',
  archived: 'negative',
  changed: 'primary'
};

const CurrentStatus = ({ status }) => (
  <li className={styles.schedule}>
    <span>Current</span>
    <span className={styles.info}>
      <Tag className={styles.actionType} tagType={tagTypeForStatus[status]}>
        {status}
      </Tag>
    </span>
  </li>
);

export const schedulePropTypes = {
  status: PropTypes.oneOf(['draft', 'published', 'archived', 'changed'])
};
CurrentStatus.propTypes = schedulePropTypes;

export default CurrentStatus;
