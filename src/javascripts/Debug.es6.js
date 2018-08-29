import require from 'require';
import * as Config from 'Config';
import { includes, mapValues } from 'lodash';
import * as UIVersionSwitcher from 'debug/UIVersionSwitcher';
import * as MockApiToggle from 'debug/MockApiToggle';
import * as EnforceFlags from 'debug/EnforceFlags';

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
const modules = {
  analytics: 'analytics/console',
  http: 'debug/XHR'
};

function initDevNotifications() {
  UIVersionSwitcher.init();
  MockApiToggle.init();
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
  const initializers = mapValues(modules, module => {
    return require(module).default;
  });
  return makeLazyObj(initializers);
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
    return () => {
      obj[key] = fn();
      return obj[key];
    };
  });
  return target;
}
