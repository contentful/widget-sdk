import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'core/utils/kefir';
import moment from 'moment';
import { validateEvent } from 'analytics/Validator';
import { captureWarning } from 'core/monitoring';

import { getSegmentSchemaForEvent, getSnowplowSchemaForEvent } from 'analytics/transform';
import * as Snowplow from 'analytics/snowplow';
import { render } from 'analytics/AnalyticsConsole';
import { buildPayload } from './segment';

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
  const setIsVisible = (isVisible) => {
    const scope = getScope();
    render({ ...scope, ...overrideScopeOptions, isVisible, setIsVisible });
  };
  setIsVisible(true);

  return 'enjoy tracking! :wave:';
}

/**
 * @param {string} name
 * @param {TransformedEventData} transformedData Transformed event data.
 * @param {EventData} rawData Original untransformed analytics.track() event data.
 * @description
 * Adds an event to the console.
 */
export function add(name, transformedData, rawData) {
  const event = {
    time: moment().format('HH:mm:ss'),
    isValid: validateEvent(name),
    raw: {
      name: name,
      data: rawData,
    },
  };

  const snowplowEvent = buildSnowplowEvent(name, transformedData);
  if (snowplowEvent) {
    const snowplowSchema = getSnowplowSchemaForEvent(name);

    event.snowplow = {
      name: snowplowSchema.name,
      version: snowplowSchema.version,
      data: snowplowEvent[1],
      context: snowplowEvent[2],
    };
  }

  const segmentSchema = getSegmentSchemaForEvent(name);
  event.segment = {
    name: segmentSchema.name,
    version: segmentSchema.version,
    data: buildPayload(segmentSchema, transformedData),
  };

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
    captureWarning(new Error(message), { extra: { event } });
  }
}

export function init(overrideScopeOptions) {
  isEnabled = true;
  show(overrideScopeOptions);
}

export const setSessionData = sessionDataBus.set;
