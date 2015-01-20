'use strict';

angular.module('contentful').directive('cfClearOutlines', ['$document', function ($document) {
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
      $document.on('keydown', function (ev) {
        if(ev.metaKey) return;
        $body.removeClass('outlines-enabled');
        disableOutlines.html('');
      });
    }
  };
}]);
