import { registerFactory, registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import moment from 'moment';
import { validateEvent } from 'analytics/Validator.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name analytics/console
   * @description
   * A small UI component presenting all events being tracked. Can be
   * turned on (not in production) by calling `cfDebug.analytics()` from
   * the console
   *
   * TODO We should invert the dependencies. Currently the 'Analytics'
   * module requires this module and uses 'add()' and 'setSessionData()'
   * to interact with the console. Instead this module should require
   * 'Analytics' and use an event stream provided by the 'Analytics'
   * module.
   */
  registerFactory('analytics/console', [
    '$rootScope',
    '$compile',
    'logger',
    'analytics/snowplow/Snowplow.es6',
    'analytics/snowplow/Events.es6',
    ($rootScope, $compile, logger, Snowplow, SnowplowEvents) => {
      const { buildUnstructEventData: buildSnowplowEvent } = Snowplow;
      const { getSchema: getSnowplowSchema } = SnowplowEvents;

      let isEnabled = false;
      let el = null;

      const eventsBus = K.createBus();
      const sessionDataBus = K.createPropertyBus();

      const events$ = eventsBus.stream.scan((events, newEvent) => events.concat([newEvent]), []);
      events$.onValue(_.noop);

      const scope = _.extend($rootScope.$new(true), {
        events$: events$,
        sessionData$: sessionDataBus.property
      });

      return {
        /**
         * @ngdoc method
         * @name analytics/console#default
         * @description
         * Enables and opens the console.
         *
         * After this we record events send from the analytics service.
         *
         * Mocks ES6 default export. Used by 'Debug' module to initialize
         * service.
         */
        default: function() {
          isEnabled = true;
          show();
        },

        add: add,
        /**
         * @ngdoc method
         * @name analytics/console#setUserData
         * @param {object} data
         * @description
         * Replaces current session data.
         */
        setSessionData: sessionDataBus.set
      };

      /**
       * @ngdoc method
       * @name analytics/console#show
       * @returns {string|undefined}
       * @description
       * Activates the console.
       */
      function show() {
        el = el || $compile('<cf-analytics-console />')(scope);
        const first = el[0];
        if (!first.parentElement) {
          document.body.appendChild(first);
        }

        scope.$applyAsync(() => {
          scope.isVisible = true;
        });

        return 'enjoy tracking! :wave:';
      }

      /**
       * @ngdoc method
       * @name analytics/console#add
       * @param {string} name
       * @param {object?} data
       * @description
       * Adds an event to the console.
       */
      function add(name, data) {
        const snowplowEvent = buildSnowplowEvent(name, data);

        const event = {
          time: moment().format('HH:mm:ss'),
          name: name,
          data: data,
          isValid: validateEvent(name)
        };

        if (snowplowEvent) {
          const snowplowSchema = getSnowplowSchema(name);

          event.snowplow = {
            name: snowplowSchema.name,
            version: snowplowSchema.version,
            data: snowplowEvent[1],
            context: snowplowEvent[2]
          };
        }

        eventsBus.emit(event);
        throwOrLogInvalidEvent(event);
      }

      function throwOrLogInvalidEvent(event) {
        if (event.isValid) {
          return;
        }

        const message = 'Invalid analytical event name: ' + event.name;
        if (isEnabled) {
          throw new Error(message);
        } else {
          logger.logWarn(message, { data: { event: event } });
        }
      }
    }
  ]);

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

        scope.toggleSnowplowDebugInfo = () => {
          scope.showSessionData = false;
          scope.showingSnowplowDebugInfo = !scope.showingSnowplowDebugInfo;

          if (scope.showingSnowplowDebugInfo) {
            scrollDown();
          }
        };

        scope.events$.onValue(events => {
          scope.events = events;
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
