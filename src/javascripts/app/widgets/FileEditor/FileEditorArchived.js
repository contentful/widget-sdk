import React from 'react';
import PropTypes from 'prop-types';
import Thumbnail from 'components/Thumbnail/Thumbnail';

export function FileEditorArchived(props) {
  return (
    <div className="file-archived">
      <Thumbnail file={props.file} height="60" icon />{' '}
      <span className="message">Preview unavailable for archived assets</span>
    </div>
  );
}

FileEditorArchived.propTypes = {
  file: PropTypes.shape({
    contentType: PropTypes.string.isRequired
  })
};
