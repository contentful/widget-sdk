import { registerFilter } from 'NgRegistry';
import _ from 'lodash';
import fileSize from 'file-size';
import mimetype from '@contentful/mimetype';

import { truncate, truncateMiddle } from 'utils/StringUtils';
import * as AssetUrlService from 'services/AssetUrlService';

export default function register() {
  registerFilter('dateTime', () => unixTime => {
    if (unixTime) {
      return new Date(unixTime).toLocaleString('de-DE');
    } else {
      return unixTime;
    }
  });

  registerFilter('isEmpty', () => _.isEmpty);
  registerFilter('isArray', () => _.isArray);
  registerFilter('fileSize', () => fileSizeInByte => fileSize(fileSizeInByte).human('si'));

  registerFilter('mimeGroup', () => file => {
    if (file) {
      return mimetype.getGroupName({
        type: file.contentType,
        fallbackFileName: file.fileName
      });
    }
  });

  registerFilter('fileType', () => file => {
    if (file) {
      return mimetype.getGroupName({
        type: file.contentType,
        fallbackFileName: file.fileName
      });
    }

    return '';
  });

  registerFilter('assetUrl', () => assetOrUrl => AssetUrlService.transformHostname(assetOrUrl));

  registerFilter('fileExtension', () => file => {
    if (file) {
      const ext = mimetype.getExtension(file.fileName);
      return ext ? ext.slice(1) : '';
    }
    return '';
  });

  registerFilter('decimalMarks', () => str => {
    str = str ? str + '' : '';
    let markedStr = '';
    let i = str.length;
    for (i = str.length; i > 0; i -= 3) {
      markedStr = str.slice(i - 3, i) + (i < str.length ? ',' : '') + markedStr;
    }
    return str.slice(0, i < 0 ? 3 + i : i) + (str.length > 3 ? markedStr : '');
  });

  registerFilter('displayedFieldName', () => {
    return field =>
      _.isEmpty(field.name)
        ? _.isEmpty(field.id)
          ? 'Untitled field'
          : 'ID: ' + field.id
        : field.name;
  });

  registerFilter('isDisplayableAsTitle', () => field =>
    field.type === 'Symbol' || field.type === 'Text'
  );

  registerFilter('truncate', () => truncate);
  registerFilter('truncateMiddle', () => truncateMiddle);
}
