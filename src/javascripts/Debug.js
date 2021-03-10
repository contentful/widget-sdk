import * as Config from 'Config';
import { includes, mapValues } from 'lodash';
import * as UIVersionSwitcher from 'debug/UIVersionSwitcher';
import * as EnforceFlags from 'debug/EnforceFlags';
import * as analyticsConsole from 'analytics/analyticsConsoleController';

const DEBUG_ENVS = ['development', 'preview', 'staging'];

/**
 * Create the debugger and attach it to the global object if debugging is
 * enabled for the current environment.
 *
 * This function is called in the boot hook of the application prelude.
 */
export function init(global) {
  if (includes(DEBUG_ENVS, Config.env)) {
    initDevNotifications();
    global.cfDebug = create();
  }
}

// Maps debug tool names to modules that export the tool.
//
// The initializer for the tool is the default export of the module.
// The key is the property name to which we export the module on
// `global.cfDebug`.
function initDevNotifications() {
  UIVersionSwitcher.init();
  EnforceFlags.init();
}

/**
 * Create an object with lazily instantiated debuggers.
 *
 * ~~~js
 * window.cfDebug.analytics()
 * window.cfDebug.analytics.show()
 * ~~~~
 */
function create() {
  const modules = {
    analytics: analyticsConsole.init,
  };

  return makeLazyObj(modules);
}

/**
 * Takes an object with function values that lazily compute the object
 * properties.
 *
 * Once a specific method is called, we replace the object property with the
 * result of that method.
 *
 * ~~~js
 * const obj = makeLazyObj({ foo: () => 'bar' })
 * obj.foo()  // => 'bar'
 * obj.foo  // => 'bar'
 * ~~~
 */
function makeLazyObj(obj) {
  const target = mapValues(obj, (fn, key) => {
    return (...args) => {
      obj[key] = fn(...args);
      return obj[key];
    };
  });
  return target;
}
