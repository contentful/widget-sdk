'use strict';

angular.module('contentful').directive('cfFileDrop', ['filepicker', 'notification', 'logger', function (filepicker, notification, logger) {
  var IGNORED_ERRORS = [
    'WrongType',
    'TooManyFiles',
    'WrongSize'
  ];

  return {
    restrict: 'C',
    transclude: true,
    template: JST['cf_file_drop'],
    link: function (scope, elem) {
      var files;

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
            if(_.contains(IGNORED_ERRORS, type))
              notification.warn('Upload failed due to an unknown error. We have been notified.');
            else
              notification.warn('Upload failed: '+message);
            if(!_.contains(IGNORED_ERRORS, type)){
              logger.logError('Upload failed', {
                data: {
                  type: type,
                  message: message,
                  files: files
                }
              });
            }
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
