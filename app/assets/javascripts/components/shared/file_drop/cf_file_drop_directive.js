'use strict';

angular.module('contentful').directive('cfFileDrop', function (filepicker, notification) {
  return {
    restrict: 'C',
    transclude: true,
    template: JST['cf_file_drop'],
    link: function (scope, elem) {
      scope.state = 'drag';
      filepicker.makeDropPane(elem[0], {
        multiple: false,
        dragEnter: function() {
          scope.$apply('state="drop"');
        },
        dragLeave: function() {
          scope.$apply('state="drag"');
        },
        onSuccess: function(InkBlobs) {
          scope.$apply(function () {
            scope.state = 'drag';
            scope.$emit('cfFileDropped', InkBlobs[0]);
          });
        },
        onError: function(type, message) {
          scope.$apply(function () {
            scope.state = 'drag';
            notification.error('Upload failed: ' + message );
          });
        },
        onStart: function (files) {
          scope.$apply(function () {
            scope.state = 'progress';
            scope.filename = files[0].name;
          });
        },
        onProgress: function(percentage) {
          scope.$apply(function () {
            scope.percentage = percentage;
          });
        }
      });
    }
  };
});
