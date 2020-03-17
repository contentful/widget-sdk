import React from 'react';
import PropTypes from 'prop-types';

const SnapshotPresenterBoolean = ({ value, settings }) => {
  const { trueLabel = 'Yes', falseLabel = 'No' } = settings;
  return (
    <div data-test-id="snapshot-presenter-boolean">
      {value ? <span>{trueLabel}</span> : <span>{falseLabel}</span>}
    </div>
  );
};

SnapshotPresenterBoolean.propTypes = {
  value: PropTypes.bool.isRequired,
  settings: PropTypes.shape({
    trueLabel: PropTypes.string,
    falseLabel: PropTypes.string
  })
};

export default SnapshotPresenterBoolean;
