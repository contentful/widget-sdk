import React from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@contentful/forma-36-react-components';

const SnapshotStatus = ({ isCurrent, snapshotType }) => {
  if (isCurrent) return <Tag tagType="secondary">current</Tag>;
  if (snapshotType === 'publish') return <Tag tagType="positive">published</Tag>;
  return <Tag tagType="warning">other</Tag>;
};

SnapshotStatus.propTypes = {
  isCurrent: PropTypes.bool,
  snapshotType: PropTypes.string,
};

export default SnapshotStatus;
