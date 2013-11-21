'use strict';

angular.module('contentful').directive('cfFileDrop', function (filepicker, notification) {
  return {
    restrict: 'C',
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
            scope.$emit('cfFileDropped', InkBlobs[0]);
          });
        },
        onError: function(type, message) {
          scope.$apply(function (scope) {
            scope.state = 'drag';
            notification.error('Upload failed: ' + message );
          });
        },
        onStart: function () {
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
});
