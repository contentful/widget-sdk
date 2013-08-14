'use strict';

angular.module('contentful').directive('cfFileDrop', function (filepicker, notification) {
  return {
    restrict: 'C',
    template: JST['cf_file_drop'],
    link: function (scope, elem) {
      filepicker.makeDropPane(elem[0], {
        multiple: false,
        dragEnter: function() {
          elem.find('.drag-me').hide();
          elem.find('.drop-me').show();
        },
        dragLeave: function() {
          elem.find('.drag-me').show();
          elem.find('.drop-me').hide();
        },
        onSuccess: function(InkBlobs) {
          elem.find('.drag-me').show();
          elem.find('.drop-me').hide();
          elem.find('.progress').hide();
          scope.$apply(function () {
            scope.$emit('cfFileDropped', InkBlobs[0]);
          });
        },
        onError: function(type, message) {
          elem.find('.drag-me').show();
          elem.find('.drop-me').hide();
          elem.find('.progress').hide();
          scope.$apply(function () {
            notification.error('Upload failed: ' + message );
          });
        },
        onStart: function (files) {
          elem.find('.drag-me').hide();
          elem.find('.drop-me').hide();
          elem.find('.progress').show();
          elem.find('.filename').html(files[0].name);
        },
        onProgress: function(percentage) {
          elem.find('.percent').html(percentage);
        }
      });
    }
  };
});
