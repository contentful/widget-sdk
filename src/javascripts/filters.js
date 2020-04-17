import { registerFilter } from 'core/NgRegistry';
import _ from 'lodash';
import fileSize from 'file-size';
import mimetype from '@contentful/mimetype';

import { truncate, truncateMiddle } from 'utils/StringUtils';
import * as AssetUrlService from 'services/AssetUrlService';

export default function register() {
  registerFilter('dateTime', function dateTime() {
    return (unixTime) => {
      if (unixTime) {
        return new Date(unixTime).toLocaleString('de-DE');
      } else {
        return unixTime;
      }
    };
  });

  registerFilter('isEmpty', function isEmptyFilter() {
    return _.isEmpty;
  });
  registerFilter('isArray', function isArray() {
    return _.isArray;
  });
  registerFilter('fileSize', function fileSizeFilter() {
    return (fileSizeInByte) => fileSize(fileSizeInByte).human('si');
  });

  registerFilter('fileType', function fileTypeFilter() {
    return (file) => {
      if (file) {
        return mimetype.getGroupName({
          type: file.contentType,
          fallbackFileName: file.fileName,
        });
      }

      return '';
    };
  });

  registerFilter('assetUrl', function assetUrlFilter() {
    return (assetOrUrl) => AssetUrlService.transformHostname(assetOrUrl);
  });

  registerFilter('fileExtension', function fileExtensionFilter() {
    return (file) => {
      if (file) {
        const ext = mimetype.getExtension(file.fileName);
        return ext ? ext.slice(1) : '';
      }
      return '';
    };
  });

  registerFilter('decimalMarks', function decimalMarksFilter() {
    return (str) => {
      str = str ? str + '' : '';
      let markedStr = '';
      let i = str.length;
      for (i = str.length; i > 0; i -= 3) {
        markedStr = str.slice(i - 3, i) + (i < str.length ? ',' : '') + markedStr;
      }
      return str.slice(0, i < 0 ? 3 + i : i) + (str.length > 3 ? markedStr : '');
    };
  });

  registerFilter('displayedFieldName', function displayedFieldNameFilter() {
    return (field) =>
      _.isEmpty(field.name)
        ? _.isEmpty(field.id)
          ? 'Untitled field'
          : 'ID: ' + field.id
        : field.name;
  });

  registerFilter('isDisplayableAsTitle', function isDisplayableAsTitleFilter() {
    return (field) => field.type === 'Symbol' || field.type === 'Text';
  });

  registerFilter('truncate', function truncateFilter() {
    return truncate;
  });
  registerFilter('truncateMiddle', function truncateMiddleFilter() {
    return truncateMiddle;
  });
}
