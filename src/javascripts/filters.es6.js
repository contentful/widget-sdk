import { registerFilter } from 'NgRegistry.es6';
import _ from 'lodash';
import fileSize from 'file-size';
import mimetype from '@contentful/mimetype';
import hostnameTransformer from '@contentful/hostname-transformer';
import { truncate, truncateMiddle } from 'utils/StringUtils.es6';

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

/**
 * Asset URLs are always hardcoded to the host `TYPE.contentful.com`.
 * This filter transforms URL hosts by using information from the
 * `/token` endpoint. The token has a domain map mapping `TYPE` to the
 * actual domain. This is used to replace the hosts.
 */
registerFilter('assetUrl', [
  'services/TokenStore.es6',
  TokenStore => assetOrUrl => {
    const domains = TokenStore.getDomains();
    if (domains) {
      return hostnameTransformer.toExternal(assetOrUrl, domains);
    } else {
      return assetOrUrl;
    }
  }
]);

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
