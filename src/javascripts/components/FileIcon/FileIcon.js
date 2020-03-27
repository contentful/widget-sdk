import React from 'react';
import PropTypes from 'prop-types';
import { Illustration } from '@contentful/forma-36-react-components';
import mimetype from '@contentful/mimetype';

/**
 * @typedef {import('@contentful/forma-36-react-components/dist/components/Illustration/Illustration').IllustrationType IllustrationType}
 */

/**
 * @type {Record<string, IllustrationType>}
 */
const groupToIconMap = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  richtext: 'Richtext',
  presentation: 'Presentation',
  spreadsheet: 'Spreadsheet',
  pdfdocument: 'Pdf',
  archive: 'Archive',
  plaintext: 'Plaintext',
  code: 'Code',
  markup: 'Markup',
};

const DEFAULT_ILLUSTRATION_NAME = groupToIconMap.archive;

/**
 * Given a file object determines the mimetype group label and returns the Illustration name
 *
 * If no valid illustration name could be mapped defeaults to Archive
 *
 * @param {object} file
 * @param {string} file.contentType
 * @param {string?} file.fileName
 * @returns {IllustrationType}
 */
function fileToIllustrationName(file) {
  if (!file) {
    return DEFAULT_ILLUSTRATION_NAME;
  }

  const groupName = mimetype.getGroupLabel({
    type: file.contentType,
    fallbackFileName: file.fileName,
  });

  return groupToIconMap[groupName] || DEFAULT_ILLUSTRATION_NAME;
}

export default function FileIcon(props) {
  const { file, ...rest } = props;
  const illustrationName = fileToIllustrationName(file);

  return <Illustration illustration={illustrationName} {...rest} />;
}

FileIcon.propTypes = {
  file: PropTypes.shape({
    contentType: PropTypes.string.isRequired,
    fileName: PropTypes.string,
  }),
  className: PropTypes.string,
  style: PropTypes.any,
};
