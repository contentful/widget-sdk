'use strict';

angular.module('contentful').directive('cfFileDrop', ['require', function (require) {
  var filepicker   = require('filepicker');
  var logger       = require('logger');
  var notification = require('notification');

  var errorHandlers = {
    TooManyFiles: function(){
      notification.warn('Please drag only one file onto the file picker');
    },
    WrongType: function(){
      notification.warn('Could not upload: File type not supported');
    },
    WrongSize: function(){
      notification.warn('Could not upload: File too large');
    },
    NoFilesFound: function(){
      notification.warn('Could not upload: No file selected');
    },
    UploadError: function(message){
      notification.warn('Upload error: ' + message);
      logger.logError('Filedrop UploadError', {data: {message: message} });
    },
    _unknown: function(message, type) {
      notification.warn('Upload error: ' + message);
      logger.logError('Filedrop UnkownError', {data: {type: type, message: message} });
    }
  };

  return {
    restrict: 'A',
    transclude: true,
    template: JST['cf_file_drop'],
    link: function (scope, elem) {
      scope.state = 'drag';
      var inOutSemaphore = 0;
      elem.on('drop', function (event) {
        if (scope.state == 'progress') {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.originalEvent.stopImmediatePropagation();
        }
      });

      filepicker.makeDropPane(elem[0], {
        multiple: false,
        dragEnter: function() {
          inOutSemaphore++;
          if (inOutSemaphore > 0) {
            scope.$apply(function (scope) {
              if (scope.state === 'drag') scope.state = 'drop';
            });
          }
        },
        dragLeave: function() {
          inOutSemaphore--;
          if (inOutSemaphore <= 0) {
            scope.$apply(function (scope) {
              if (scope.state === 'drop') scope.state = 'drag';
            });
          }
        },
        onSuccess: function(InkBlobs) {
          scope.$apply(function () {
            scope.state = 'drag';
            elem.attr('disabled', false);
            scope.$emit('cfFileDropped', InkBlobs[0]);
          });
        },
        onError: function(type, message) {
          scope.$apply(function (scope) {
            scope.state = 'drag';
            elem.attr('disabled', false);
            var handler = errorHandlers[type] || errorHandlers._unknown;
            handler(message, type);
          });
        },
        onStart: function (files) {
          files = files;
          scope.$apply('state = "progress"');
        },
        onProgress: function(percentage) {
          scope.$apply(function () {
            scope.progressBarPercentage = percentage;
          });
        }
      });
    }
  };
}]);
