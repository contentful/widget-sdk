import React from 'react';
import PropTypes from 'prop-types';

const SnapshotPresenterStandard = ({ value, className }) => {
  return (
    <div className={className} data-test-id="snapshot-presenter-standard">
      {value}
    </div>
  );
};

SnapshotPresenterStandard.propTypes = {
  className: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

SnapshotPresenterStandard.defaultProps = {
  className: ''
};

export default SnapshotPresenterStandard;
