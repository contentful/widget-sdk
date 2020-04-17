import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'utils/kefir';
import moment from 'moment';
import { validateEvent } from 'analytics/Validator';
import * as logger from 'services/logger';

import { getSchemaForEvent } from 'analytics/transform';
import * as Snowplow from 'analytics/snowplow';

/**
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

const { buildUnstructEventData: buildSnowplowEvent } = Snowplow;

let isEnabled = false;
let el = null;
let scope = null;

const eventsBus = K.createBus();
const sessionDataBus = K.createPropertyBus();

function getScope() {
  if (scope) {
    return scope;
  }
  const $rootScope = getModule('$rootScope');

  const events$ = eventsBus.stream.scan((events, newEvent) => events.concat([newEvent]), []);
  events$.onValue(_.noop);

  scope = _.extend($rootScope.$new(true), {
    events$: events$,
    sessionData$: sessionDataBus.property,
  });

  return scope;
}

/**
 * @param {Object?} overrideScopeOptions
 * @returns {string|undefined}
 * @description
 * Activates the console.
 */
function show(overrideScopeOptions) {
  const $compile = getModule('$compile');
  const scope = getScope();

  el = el || $compile('<cf-analytics-console />')(scope);
  const first = el[0];
  if (!first.parentElement) {
    document.body.appendChild(first);
  }

  scope.$applyAsync(() => {
    scope.isVisible = true;
    Object.assign(scope, overrideScopeOptions);
  });

  return 'enjoy tracking! :wave:';
}

/**
 * @param {string} name
 * @param {object?} data
 * @description
 * Adds an event to the console.
 */
export function add(name, data) {
  const snowplowEvent = buildSnowplowEvent(name, data);

  const event = {
    time: moment().format('HH:mm:ss'),
    name: name,
    data: data,
    isValid: validateEvent(name),
  };

  if (snowplowEvent) {
    const snowplowSchema = getSchemaForEvent(name);

    event.snowplow = {
      name: snowplowSchema.name,
      version: snowplowSchema.version,
      data: snowplowEvent[1],
      context: snowplowEvent[2],
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

export function init(overrideScopeOptions) {
  isEnabled = true;
  show(overrideScopeOptions);
}

export const setSessionData = sessionDataBus.set;
