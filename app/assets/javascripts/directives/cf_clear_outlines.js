angular.module('contentful').directive('cfClearOutlines', ['$document', function ($document) {
  'use strict';

  return {
    restrict: 'C',
    link: function () {
      var disableOutlines = $('#disable-outlines');
      $document.on('mousedown', function () {
        disableOutlines.html('*,*:focus{outline:none !important;}');
      });
      $document.on('keydown', function () {
        disableOutlines.html('');
      });
    }
  };
}]);
