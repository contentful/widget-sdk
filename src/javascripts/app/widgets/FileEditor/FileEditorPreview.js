import React from 'react';
import PropTypes from 'prop-types';
import Thumbnail from 'components/Thumbnail/Thumbnail';

export function FileEditorPreview(props) {
  return (
    <div className="file-preview">
      <Thumbnail file={props.file} height="250" />
    </div>
  );
}

FileEditorPreview.propTypes = {
  file: PropTypes.object.isRequired,
};
