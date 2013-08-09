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

filters.filter('mimeGroup', function (mimetypeGroups) {
  return function (file) {
    if (file) return mimetypeGroups.getDisplayName(
      mimetypeGroups.getExtension(file.fileName),
      file.contentType
    );
  };
});
