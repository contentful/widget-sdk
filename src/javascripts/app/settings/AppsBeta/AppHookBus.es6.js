import mitt from 'mitt';
import { isObject } from 'lodash';

export const APP_UPDATE_STARTED = 'app-update-started';
export const APP_CONFIGURED = 'app-configured';
export const APP_MISCONFIGURED = 'app-misconfigured';
export const APP_EXTENSION_UPDATED = 'app-extension-updated';
export const APP_EXTENSION_UPDATE_FAILED = 'app-extension-update-failed';
export const APP_UPDATE_FINALIZED = 'app-update-finalized';
export const APP_UPDATE_FAILED = 'app-update-failed';

export function makeAppHookBus() {
  const bus = mitt();

  // TODO: remove
  bus.on('*', (eventName, data) => {
    console.log(eventName, data); // eslint-disable-line no-console
  });

  let parameters = null;

  return {
    on: (eventName, handler) => bus.on(eventName, handler),
    emit: (eventName, data) => bus.emit(eventName, data),
    setParameters: value => {
      if (isObject(value)) {
        parameters = { ...value };
      } else {
        parameters = {};
      }
    },
    unsetParameters: () => {
      parameters = null;
    },
    getParameters: () => parameters
  };
}
