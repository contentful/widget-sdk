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

filters.filter('fileSize', function () {
  return function (fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
    } while (fileSizeInBytes > 1024);

    var size = Math.max(fileSizeInBytes, 0.1);
    var fixed = Math.round(size) < 100 ? 1 : 0;
    return size.toFixed(fixed) + byteUnits[i];
  };
});

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

filters.filter('assetUrl', ['hostnameTransformer', 'authentication', function (hostnameTransformer, authentication) {
  return function (assetOrUrl) {
    var domains = dotty.get(authentication, 'tokenLookup.domains');
    if (domains) {
      return hostnameTransformer.toExternal(assetOrUrl, preprocessDomains(domains));
    } else {
      return assetOrUrl;
    }
  };

  function preprocessDomains (domains) {
    var result = {};
    domains.forEach(function (domain) {
      result[domain.name] = domain.domain;
    });
    return result;
  }
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
    if (!currentUser || !user) return '';
    return (currentUser.getId() === user.sys.id) ? 'Me' : currentUser.getName();
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
