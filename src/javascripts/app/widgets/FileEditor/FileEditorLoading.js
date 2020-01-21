import React from 'react';
import PropTypes from 'prop-types';

export function FileEditorLoading(props) {
  return (
    <div className="file-progress loading-box--stretched">
      <div className="loading-box__spinner"></div>
      {props.message}
    </div>
  );
}

FileEditorLoading.propTypes = {
  message: PropTypes.string.isRequired
};

FileEditorLoading.defaultProps = {
  message: 'Loading...'
};
