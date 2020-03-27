import React from 'react';
import PropTypes from 'prop-types';
import fileSize from 'file-size';
import mimetype from '@contentful/mimetype';

function getMimeGroup(file) {
  if (file) {
    return mimetype.getGroupName({
      type: file.contentType,
      fallbackFileName: file.fileName,
    });
  }
  return '';
}

function getFileSize(fileSizeInByte) {
  return fileSize(fileSizeInByte).human('si');
}

export function FileEditorMetadata(props) {
  const { file } = props;
  return (
    <div className="file-metadata">
      <table>
        <tr>
          <th>Filename</th>
          <td>{file.fileName}</td>
        </tr>
        <tr>
          <th>Type</th>
          <td title={file.contentType}>{getMimeGroup(file)}</td>
        </tr>
        {file.details.size && (
          <tr>
            <th>Size</th>
            <td title={`${file.details.size} Bytes`}>{getFileSize(file.details.size)}</td>
          </tr>
        )}
        {file.details.image && (
          <tr>
            <th>
              Width
              <br />
              Height
            </th>
            <td>
              {file.details.image.width}&thinsp;px
              <br />
              {file.details.image.height}&thinsp;px
            </td>
          </tr>
        )}
      </table>
    </div>
  );
}

FileEditorMetadata.propTypes = {
  file: PropTypes.object.isRequired,
};
