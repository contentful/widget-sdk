/* global SystemJS */

import $q from 'test/helpers/$q';
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
  window.testRegistry.forEach(args => registerInIsolatedSystem(isolatedSystem, args));
  window.libs.forEach(args => registerLibrary(isolatedSystem, args));

  // Also register special helper $q
  registerInIsolatedSystem(isolatedSystem, ['test/helpers/$q', [], createRegistrationWrapper($q)]);

  return {
    [sysSymbol]: isolatedSystem,
    set: function(path, module) {
      const newModule = isolatedSystem.newModule(module);

      isolatedSystem.registry.delete(isolatedSystem.resolveSync(path));

      isolatedSystem.registry.set(isolatedSystem.resolveSync(path), newModule);

      return null;
    },
    import: function(path) {
      return isolatedSystem.import(path);
    },
    override: async function(path, update) {
      const currentModule = await isolatedSystem.import(path);

      const newModule = Object.assign({}, currentModule, update);

      this.set(path, newModule);

      return null;
    }
  };
}

function registerLibrary(system, [name, dep]) {
  system.register(name, [], export_ => {
    const exports = dep;
    export_(Object.assign({ default: exports }, exports));
    return {
      setters: [],
      execute: function() {}
    };
  });
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
