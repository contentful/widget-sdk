import mitt from 'mitt';
import { isObject } from 'lodash';

/**
 * A communication bus to be used to realize App lifecycle hooks.
 *
 * When a user clicks on "Install" (App not installed) or "Save configuration"
 * (App installed, updating configuration), the `APP_EVENTS_OUT.STARTED` event
 * is emitted by the Web App.
 *
 * A handler passed to `sdk.app.onConfigure(handler)` is invoked and its result
 * is used as configuration. The configuration is included in the incoming
 * `APP_EVENTS_IN.CONFIGURED` event. If no handler was registered, the event is
 * still emitted but includes empty configuration. If the handler produced `false`,
 * the `APP_EVENTS_IN.MISCONFIGURED` event with no configuration is emitted.
 *
 * Once the App is installed or updated, the Web App emits the
 * `APP_EVENTS_OUT.SUCCEEDED` event. If the operation failed, the
 * `APP_EVENTS_OUT.FAILED` event is emitted. Both can be handled with the SDK.
 */

export const APP_EVENTS_OUT = {
  STARTED: 'app-events-out-started',
  FAILED: 'app-events-out-failed',
  SUCCEEDED: 'app-events-out-succeeded'
};

export const APP_EVENTS_IN = {
  CONFIGURED: 'app-events-in-configured',
  MISCONFIGURED: 'app-events-in-misconfigured',
  MARKED_AS_READY: 'app-events-in-ready'
};

export function makeAppHookBus() {
  const bus = mitt();

  let installation = null;

  return {
    on: (eventName, handler) => {
      bus.on(eventName, handler);
    },
    emit: (eventName, data) => {
      bus.emit(eventName, data);
    },
    setInstallation: value => {
      if (isObject(value)) {
        const { parameters } = value;
        installation = value;
        installation.parameters = isObject(parameters) ? parameters : {};
      } else {
        installation = null;
      }
    },
    getInstallation: () => installation
  };
}
