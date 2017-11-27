'use strict';

var filters = angular.module('contentful');

filters.filter('dateTime', function () {
  return function (unixTime) {
    if (unixTime) {
      return new Date(unixTime).toLocaleString('de-DE');
    } else {
      return unixTime;
    }
  };
});

filters.filter('isEmpty', function () {
  return _.isEmpty;
});

filters.filter('isArray', function () {
  return _.isArray;
});

filters.filter('fileSize', ['require', function (require) {
  return function (fileSizeInByte) {
    const fileSize = require('fileSize');

    return fileSize(fileSizeInByte).human('si');
  };
}]);

filters.filter('mimeGroup', ['mimetype', function (mimetype) {
  return function (file) {
    if (file) {
      return mimetype.getGroupName({
        type: file.contentType,
        fallbackFileName: file.fileName
      });
    }
  };
}]);

filters.filter('isFileMissing', function () {
  return function (file) {
    return !!file;
  };
});

filters.filter('isFileProcessing', function () {
  return function (file) {
    return file && !!file.upload;
  };
});

filters.filter('isFileReady', function () {
  return function (file) {
    return file && !!file.url;
  };
});

filters.filter('fileType', ['mimetype', function (mimetype) {
  return function (file) {
    if (file) {
      return mimetype.getGroupName({
        type: file.contentType,
        fallbackFileName: file.fileName
      });
    }
    return '';
  };
}]);

/**
 * Asset URLs are always hardcoded to the host `TYPE.contentful.com`.
 * This filter transforms URL hosts by using information from the
 * `/token` endpoint. The token has a domain map mapping `TYPE` to the
 * actual domain. This is used to replace the hosts.
 */
filters.filter('assetUrl', ['hostnameTransformer', 'services/TokenStore', function (hostnameTransformer, TokenStore) {
  return function (assetOrUrl) {
    var domains = TokenStore.getDomains();
    if (domains) {
      return hostnameTransformer.toExternal(assetOrUrl, domains);
    } else {
      return assetOrUrl;
    }
  };
}]);

filters.filter('fileExtension', ['mimetype', function (mimetype) {
  return function (file) {
    if (file) {
      var ext = mimetype.getExtension(file.fileName);
      return ext ? ext.slice(1) : '';
    }
    return '';
  };
}]);

filters.filter('userNameDisplay', function () {
  return function (currentUser, user) {
    if (!currentUser || !user) {
      return '';
    } else if (currentUser.sys.id === user.sys.id) {
      return 'Me';
    } else {
      return currentUser.firstName + ' ' + currentUser.lastName;
    }
  };
});

filters.filter('decimalMarks', function () {
  return function (str) {
    str = str ? str + '' : '';
    var markedStr = '';
    for (var i = str.length; i > 0; i -= 3) {
      markedStr = str.slice(i - 3, i) + (i < str.length ? ',' : '') + markedStr;
    }
    return str.slice(0, i < 0 ? 3 + i : i) + (str.length > 3 ? markedStr : '');
  };
});

filters.filter('displayedFieldName', function () {
  return function (field) {
    return _.isEmpty(field.name)
      ? _.isEmpty(field.id) ? 'Untitled field' : 'ID: ' + field.id
      : field.name;
  };
});

filters.filter('isDisplayableAsTitle', function () {
  return function (field) {
    return field.type === 'Symbol' || field.type === 'Text';
  };
});

filters.filter('truncate', ['stringUtils', function (stringUtils) {
  return stringUtils.truncate;
}]);

filters.filter('truncateMiddle', ['stringUtils', function (stringUtils) {
  return stringUtils.truncateMiddle;
}]);

filters = null;
