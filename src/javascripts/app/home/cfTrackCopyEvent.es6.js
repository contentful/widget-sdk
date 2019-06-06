import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import $ from 'jquery';
import window from 'utils/ngCompat/window.es6';
import * as HomeAnalyticsEvents from 'analytics/events/home.es6';

export default function register() {
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

  registerDirective('cfTrackCopyEvent', [
    () => ({
      restrict: 'A',
      scope: true,
      link: function(scope, element) {
        $(window.document).on('keydown', handleKeydown);

        scope.$on('$destroy', () => {
          $(window.document).off('keydown', handleKeydown);
        });

        function handleKeydown(event) {
          if (event.key === 'c' && event.metaKey) {
            const selection = window.getSelection();
            const selectedNode = _.get(selection, 'anchorNode.parentNode');
            // Only track event if selected text is contained in this section
            if ($.contains(element[0], selectedNode)) {
              const language = scope.resources.selected;
              HomeAnalyticsEvents.commandCopied(language, selection.toString());
            }
          }
        }
      }
    })
  ]);
}
