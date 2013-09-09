angular.module('contentful').directive('cfClearOutlines', ['$document', function ($document) {
  'use strict';

  return {
    restrict: 'C',
    link: function () {
      var $body = $document.find('body');
      var disableOutlines = $('#disable-outlines');
      $body.addClass('outlines-enabled');
      $document.on('mousedown', function () {
        $body.addClass('outlines-enabled');
        disableOutlines.html('*,*:focus{outline:none !important;}');
      });
      $document.on('keydown', function () {
        $body.removeClass('outlines-enabled');
        disableOutlines.html('');
      });
    }
  };
}]);
