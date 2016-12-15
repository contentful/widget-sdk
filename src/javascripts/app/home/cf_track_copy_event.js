/**
 * @ngdoc directive
 * @module contentful
 * @name cfTrackCopyEvent
 *
 * @description
 * This directive tracks copy commands made via cmd+C / ctrl+C events on the
 * element it is attached to.
 * It is used exclusively for the app homepage.
 *
 */

'use strict';

angular.module('contentful')

.directive('cfTrackCopyEvent', ['require', function (require) {

  var $document = require('$document');
  var $window = require('$window');
  var analytics = require('analytics');

  return {
    restrict: 'A',
    scope: true,
    link: function (scope, element) {

      $document.on('keydown', handleKeydown);

      scope.$on('$destroy', function () {
        $document.off('keydown', handleKeydown);
      });

      function handleKeydown (event) {
        if (event.key === 'c' && event.metaKey) {
          var selection = $window.getSelection();
          var selectedNode = _.get(selection, 'anchorNode.parentNode');
          // Only track event if selected text is contained in this section
          if ($.contains(element[0], selectedNode)) {
            analytics.track('home:command_copied', {
              language: scope.home.selectedLanguage,
              selectedText: selection.toString()
            });
          }
        }
      }
    }
  };
}]);
