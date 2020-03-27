import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import cx from 'classnames';
import mimetype from '@contentful/mimetype';
import { pickBy, isEmpty } from 'lodash';
import { isValidImage, getExternalImageUrl } from 'directives/thumbnailHelpers';

const groupToIconMap = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  richtext: 'word',
  presentation: 'powerpoint',
  spreadsheet: 'excel',
  pdfdocument: 'pdf',
  archive: 'zip',
  plaintext: 'text',
  code: 'code',
  markup: 'code',
};

/**
 * Given a file object from an asset and a list of options this
 * function produces the URL for a thumbnail from the original image
 * URL.
 *
 * It might return `null` if the file does not have a URL or if the
 * URL is not hosted on the 'images' subdomain.
 *
 * @param {API.File}
 * @param {object} options
 * @returns {string?}
 */
function getThumbnailUrl(file, options) {
  const imageUrl = getImageUrl(file);
  if (!imageUrl) {
    return imageUrl;
  }

  const params = pickBy(
    {
      w: options.width,
      h: options.height !== undefined ? options.height : options.width,
      f: options.focus,
      fit: options.fit,
    },
    (value) => !!value
  );

  if (isEmpty(params)) {
    return imageUrl;
  } else {
    return imageUrl + '?' + qs.stringify(params);
  }
}

/**
 * Get the external image URL if the file has an image MIME type and
 * is served from the contentful image proxy service.
 *
 * Otherwise return `null`.
 */
function getImageUrl(file) {
  if (!file) {
    return null;
  }

  if (isValidImage(file.contentType)) {
    return getExternalImageUrl(file.url);
  } else {
    return null;
  }
}

function getIconName(file) {
  if (!file) {
    return '';
  }

  const groupName = mimetype.getGroupLabel({
    type: file.contentType,
    fallbackFileName: file.fileName,
  });

  if (groupName in groupToIconMap) {
    return 'fa fa-file-' + groupToIconMap[groupName] + '-o';
  } else {
    return 'fa fa-paperclip';
  }
}

export default function Thumbnail(props) {
  const options = {
    fit: props.fit,
    focus: props.focus,
  };

  const size = parseInt(props.size, 10);
  if (size > 0) {
    options.width = options.height = size;
  } else {
    options.width = props.width || undefined;
    options.height = props.height || undefined;
  }

  const thumbnailUrl = getThumbnailUrl(props.file, options);

  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        // eslint-disable-next-line rulesdir/restrict-inline-styles
        style={{
          width: options.width ? options.width + 'px' : '',
          height: options.height ? options.height + 'px' : '',
        }}
        className={cx('thumbnail', props.className)}
      />
    );
  }

  return <i className={cx('icon', props.className, getIconName(props.file))} />;
}

Thumbnail.propTypes = {
  className: PropTypes.string,
  file: PropTypes.shape({
    url: PropTypes.string,
  }),
  fit: PropTypes.any,
  focus: PropTypes.any,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
