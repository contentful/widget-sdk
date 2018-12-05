/* global SystemJS */

import $q from './$q';
import _ from 'lodash';

/**
 * Creates a mocked SystemJS system, that is isolated
 * from the global SystemJS.
 * @return {Object} Isolated System
 */
export function createIsolatedSystem() {
  const isolatedSystem = new SystemJS.constructor();
  const config = _.cloneDeep(SystemJS.getConfig());

  const sysSymbol = Symbol('isolatedSystem');

  isolatedSystem.config(config);

  // Register each existing module onto our blank system canvas
  window.AngularSystem.registry.forEach(args => registerInIsolatedSystem(isolatedSystem, args));

  // Also register special helper $q
  registerInIsolatedSystem(isolatedSystem, ['test/helpers/$q', [], createRegistrationWrapper($q)]);

  return {
    [sysSymbol]: isolatedSystem,
    set: function(path, module) {
      const newModule = isolatedSystem.newModule(module);

      isolatedSystem.delete(path);

      return isolatedSystem.set(path, newModule);
    },
    import: function(path) {
      return isolatedSystem.import(path);
    }
  };
}

function registerInIsolatedSystem(isolatedSystem, item) {
  const moduleId = item[0];

  isolatedSystem.register(...item);

  const path = moduleId.split('/');
  const last = path.pop();
  if (last === 'index.es6') {
    isolatedSystem.register(path.join('/'), [moduleId], $export => ({
      setters: [$export]
    }));
  }
}

function createRegistrationWrapper(exports) {
  return export_ => {
    // const exports = moduleObj;
    export_(Object.assign({ default: exports }, exports));
    return {
      setters: [],
      execute: function() {}
    };
  };
}
