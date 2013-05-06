'use strict';

angular.module('contentful/directives').
  directive('inputAutogrow', function() {
    return {
      restrict: 'C',
      link: function(scope, elem) {
        var lineHeight = 18; // TODO: Read from configuration as reported
                             //       line-height can be 'auto'
        var maxLines = 20;
        var verticalPadding =
          _.parseInt(elem.css('padding-bottom')) +
          _.parseInt(elem.css('padding-top'));

        function adjustHeight() {
          if (!elem.is(':focus')) return resetHeight();
          var linesHeight = verticalPadding + Math.min(maxLines, numLines()) * lineHeight;
          elem.height(Math.max(defaultHeight, linesHeight));
        }

        function numLines() {
          try {
            return elem.val().split('\n').length;
          } catch (e) {
            return 1;
          }
        }

        var defaultHeight = elem.height();
        function resetHeight() {
          elem.height(defaultHeight);
        }

        elem.on('keyup', adjustHeight);
        elem.on('focus', adjustHeight);
        elem.on('blur', adjustHeight);
      }
    };
  });

