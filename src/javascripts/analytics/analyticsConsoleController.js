import _ from 'lodash';
import * as K from 'core/utils/kefir';
import moment from 'moment';
import { validateEvent } from 'analytics/Validator';
import { captureWarning } from 'core/monitoring';

import { getSegmentSchemaForEvent, getSnowplowSchemaForEvent } from 'analytics/transform';
import { render } from 'analytics/AnalyticsConsole';

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

let isEnabled = false;
let scope = null;

const eventsBus = K.createBus();
const sessionDataBus = K.createPropertyBus();

function getScope() {
  if (scope) {
    return scope;
  }

  const events$ = eventsBus.stream.scan((events, newEvent) => events.concat([newEvent]), []);
  events$.onValue(_.noop);

  scope = {
    events$: events$,
    sessionData$: sessionDataBus.property,
  };

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
 * @param {string} name event name or Segment typewriter function name.
 * @param {TransformedSegmentEventData} transformedSegmentData Transformed event data.
 * @param {TransformedEventData?} transformedSnowplowData Transformed event data.
 * @param {Object} data Original untransformed analytics.track() event data.
 * @description
 * Adds an event to the console.
 */
export function add(name, { rawData, transformedSegmentData, transformedSnowplowData }) {
  const segmentSchema = getSegmentSchemaForEvent(name);
  // Segment schemas registration with transformers is no longer required for `Analytics.tracking.xxx()` calls.
  const isLegacyEventCall = !!segmentSchema;

  const event = {
    time: moment().format('HH:mm:ss'),
    isValid: isLegacyEventCall ? validateEvent(name) : true,
    raw: {
      name: name,
      data: rawData,
    },
  };

  const snowplowSchema = getSnowplowSchemaForEvent(name);
  if (snowplowSchema && transformedSnowplowData) {
    event.snowplow = {
      name: snowplowSchema.name,
      version: snowplowSchema.version,
      data: transformedSnowplowData.data,
      context: transformedSnowplowData.contexts,
    };
  }

  event.segment = isLegacyEventCall
    ? {
        name: segmentSchema.name,
        data: transformedSegmentData.payload,
      }
    : {
        data: rawData,
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
