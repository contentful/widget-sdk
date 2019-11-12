import { registerDirective } from 'NgRegistry';
import _ from 'lodash';

export default function register() {
  registerDirective('cfAnalyticsConsole', [
    '$timeout',
    $timeout => ({
      template: JST.analytics_console(),
      link: function(scope, $el) {
        const containerEl = $el.find('.analytics-console__content').get(0);

        scope.toggleSessionData = () => {
          scope.showingSnowplowDebugInfo = false;
          scope.showSessionData = !scope.showSessionData;

          if (scope.showSessionData) {
            scrollUp();
          } else {
            scrollDown();
          }
        };

        scope.$watchGroup(
          ['events', 'filterText', 'clearedEventsIndex', 'showingSnowplowDebugInfo'],
          (_new, _old, scope) => {
            const relevantEvents = scope.events
              .map((event, index) => ({ ...event, index }))
              .filter(isRelevantEvent);
            scope.filteredEvents = relevantEvents.filter(isSearchResultEvent);
            scope.relevantEventsCount = relevantEvents.length;
          }
        );

        function isRelevantEvent(event, index) {
          if (index <= scope.clearedEventsIndex) return false;
          if (scope.showingSnowplowDebugInfo && !event.snowplow) return false;
          return true;
        }

        function isSearchResultEvent(event) {
          if (!scope.filterText) return true;
          const isMatch = text => text.indexOf(scope.filterText) !== -1;
          return isMatch(event.name) || (event.snowplow && isMatch(event.snowplow.name));
        }

        scope.toggleSnowplowDebugInfo = () => {
          scope.showSessionData = false;
          scope.showingSnowplowDebugInfo = !scope.showingSnowplowDebugInfo;

          if (scope.showingSnowplowDebugInfo) {
            scrollDown();
          }
        };

        scope.clearEvents = () => (scope.clearedEventsIndex = scope.events.length - 1);
        scope.unclearEvents = () => (scope.clearedEventsIndex = -1);
        scope.clearSearch = () => (scope.filterText = '');

        scope.events$.onValue(events => {
          scope.events = events;
          if (scope.clearedEventsIndex === undefined) {
            // When opening the console, show no events for great performance and
            // no crazy scrolling. User can restore them if desired.
            scope.clearEvents();
          }
          if (!scope.showSessionData) {
            scrollDown();
          }
        });

        scope.sessionData$.onValue(data => {
          scope.sessionData = data;
        });

        function scrollDown() {
          $timeout(() => {
            containerEl.scrollTop = containerEl.scrollHeight;
          });
        }

        function scrollUp() {
          $timeout(() => {
            containerEl.scrollTop = 0;
          });
        }
      }
    })
  ]);
}
