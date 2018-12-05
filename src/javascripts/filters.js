'use strict';

let filters = angular.module('contentful');

filters.filter('dateTime', () => unixTime => {
  if (unixTime) {
    return new Date(unixTime).toLocaleString('de-DE');
  } else {
    return unixTime;
  }
});

filters.filter('isEmpty', [
  'require',
  require => {
    const _ = require('lodash');
    return _.isEmpty;
  }
]);

filters.filter('isArray', [
  'require',
  require => {
    const _ = require('lodash');
    return _.isArray;
  }
]);

filters.filter('fileSize', [
  'require',
  require => fileSizeInByte => {
    const fileSize = require('file-size');

    return fileSize(fileSizeInByte).human('si');
  }
]);

filters.filter('mimeGroup', [
  '@contentful/mimetype',
  mimetype => file => {
    if (file) {
      return mimetype.getGroupName({
        type: file.contentType,
        fallbackFileName: file.fileName
      });
    }
  }
]);

filters.filter('fileType', [
  '@contentful/mimetype',
  mimetype => file => {
    if (file) {
      return mimetype.getGroupName({
        type: file.contentType,
        fallbackFileName: file.fileName
      });
    }
    return '';
  }
]);

/**
 * Asset URLs are always hardcoded to the host `TYPE.contentful.com`.
 * This filter transforms URL hosts by using information from the
 * `/token` endpoint. The token has a domain map mapping `TYPE` to the
 * actual domain. This is used to replace the hosts.
 */
filters.filter('assetUrl', [
  '@contentful/hostname-transformer',
  'services/TokenStore.es6',
  (hostnameTransformer, TokenStore) => assetOrUrl => {
    const domains = TokenStore.getDomains();
    if (domains) {
      return hostnameTransformer.toExternal(assetOrUrl, domains);
    } else {
      return assetOrUrl;
    }
  }
]);

filters.filter('fileExtension', [
  '@contentful/mimetype',
  mimetype => file => {
    if (file) {
      const ext = mimetype.getExtension(file.fileName);
      return ext ? ext.slice(1) : '';
    }
    return '';
  }
]);

filters.filter('userNameDisplay', () => (currentUser, user) => {
  if (!currentUser || !user) {
    return '';
  } else if (currentUser.sys.id === user.sys.id) {
    return 'Me';
  } else {
    return currentUser.firstName + ' ' + currentUser.lastName;
  }
});

filters.filter('decimalMarks', () => str => {
  str = str ? str + '' : '';
  let markedStr = '';
  for (var i = str.length; i > 0; i -= 3) {
    markedStr = str.slice(i - 3, i) + (i < str.length ? ',' : '') + markedStr;
  }
  return str.slice(0, i < 0 ? 3 + i : i) + (str.length > 3 ? markedStr : '');
});

filters.filter('displayedFieldName', [
  'require',
  require => {
    var _ = require('lodash');
    return field =>
      _.isEmpty(field.name)
        ? _.isEmpty(field.id)
          ? 'Untitled field'
          : 'ID: ' + field.id
        : field.name;
  }
]);

filters.filter('isDisplayableAsTitle', () => field =>
  field.type === 'Symbol' || field.type === 'Text'
);

filters.filter('truncate', ['utils/StringUtils.es6', stringUtils => stringUtils.truncate]);

filters.filter('truncateMiddle', [
  'utils/StringUtils.es6',
  stringUtils => stringUtils.truncateMiddle
]);

filters = null;
