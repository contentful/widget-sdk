import React from 'react';
import PropTypes from 'prop-types';
import { Tag, Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  statusBadge: css({
    display: 'flex',
    marginBottom: tokens.spacingXs
  }),
  current: css({
    color: tokens.colorTextLight
  }),
  status: css({
    display: 'flex',
    marginLeft: 'auto'
  }),
  icon: css({
    marginRight: tokens.spacing2Xs,
    height: tokens.spacingL
  })
};

const statusMap = {
  archived: {
    tagType: 'secondary',
    title: 'Archived'
  },
  draft: {
    tagType: 'warning',
    title: 'Draft'
  },
  published: {
    tagType: 'positive',
    title: 'Published'
  },
  changes: {
    tagType: 'primary',
    title: 'Changed'
  }
};
const StatusBadge = ({ status, isScheduled }) => (
  <div className={styles.statusBadge}>
    <span className={styles.current}>Current</span>
    <span className={styles.status} data-state={status} data-test-id="entity-state">
      {isScheduled && <Icon className={styles.icon} color="muted" icon="Clock" />}
      {status && statusMap[status] && (
        <Tag tagType={statusMap[status].tagType}>{statusMap[status].title}</Tag>
      )}
    </span>
  </div>
);

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  isScheduled: PropTypes.bool
};

StatusBadge.defaultProps = {
  isScheduled: false
};

export default StatusBadge;
