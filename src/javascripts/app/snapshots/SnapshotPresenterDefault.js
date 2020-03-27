import React from 'react';
import PropTypes from 'prop-types';

const SnapshotPresenterDefault = ({ value }) => {
  return (
    <div data-test-id="snapshot-presenter-default">
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
};

SnapshotPresenterDefault.propTypes = {
  value: PropTypes.object.isRequired,
};

export default SnapshotPresenterDefault;
