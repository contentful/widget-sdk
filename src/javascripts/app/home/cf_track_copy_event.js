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

angular
  .module('contentful')

  .directive('cfTrackCopyEvent', [
    'require',
    require => {
      const $document = require('$document');
      const $window = require('$window');
      const analyticsEvents = require('analytics/events/home.es6');

      return {
        restrict: 'A',
        scope: true,
        link: function(scope, element) {
          $document.on('keydown', handleKeydown);

          scope.$on('$destroy', () => {
            $document.off('keydown', handleKeydown);
          });

          function handleKeydown(event) {
            if (event.key === 'c' && event.metaKey) {
              const selection = $window.getSelection();
              const selectedNode = _.get(selection, 'anchorNode.parentNode');
              // Only track event if selected text is contained in this section
              if ($.contains(element[0], selectedNode)) {
                const language = scope.resources.selected;
                analyticsEvents.commandCopied(language, selection.toString());
              }
            }
          }
        }
      };
    }
  ]);
