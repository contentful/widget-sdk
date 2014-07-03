'use strict';

var filters = angular.module('contentful');

filters.filter('dateTime', function() {
  return function(unixTime) {
    if (unixTime) {
      return new Date(unixTime).toLocaleString('de-DE');
    } else {
      return unixTime;
    }
  };
});

filters.filter('isEmpty', function() {
  return _.isEmpty;
});

filters.filter('fileSize', function () {
  return function (fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  };
});

filters.filter('mimeGroup', ['mimetype', function (mimetype) {
  return function (file) {
    if (file) return mimetype.getGroupDisplayName(
      mimetype.getExtension(file.fileName),
      file.contentType
    );
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
    if(file)
      return mimetype.getGroupDisplayName(
        mimetype.getExtension(file.fileName),
        file.contentType
      );
    return '';
  };
}]);

filters.filter('fileExtension', ['mimetype', function (mimetype) {
  return function (file) {
    if(file){
      var ext = mimetype.getExtension(file.fileName);
      return ext ? ext.slice(1) : '';
    }
    return '';
  };
}]);

filters.filter('isFieldLink', function () {
  return function (field) {
    return field.type == 'Link' || field.type == 'Array' && field.items.type == 'Link';
  };
});

filters.filter('isFieldBoolean', function () {
  return function (field) {
    return field.type == 'Boolean';
  };
});

filters.filter('isFieldStringList', function () {
  return function (field) {
    return field.type == 'Array' && field.items.type == 'String';
  };
});

filters.filter('userNameDisplay', function () {
  return function (currentUser, user) {
    if(!currentUser || !user) return '';
    return (currentUser.getId() === user.sys.id) ? 'Me' : currentUser.getName();
  };
});

filters.filter('decimalMarks', function () {
  return function (str) {
    str = str ? str+'' : '';
    var markedStr = '', bound;
    for(var i=str.length; bound=i-3, i>0; i=bound){
      markedStr = str.slice(bound, i) + (i < str.length ? ',' : '') + markedStr;
    }
    return str.slice(0, i<0 ? 3+i : i) + (str.length>3 ? markedStr : '');
  };
});
