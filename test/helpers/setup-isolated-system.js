/* global SystemJS */

import _ from 'lodash';

/*
 This helper resets the global SystemJS on each test run
*/

beforeEach(function() {
  const isolatedSystem = new SystemJS.constructor();
  const config = _.cloneDeep(SystemJS.getConfig());

  isolatedSystem.config(config);

  // Register each existing module onto our blank system canvas
  window.testRegistry.forEach(args => registerInIsolatedSystem(isolatedSystem, args));
  window.libs.forEach(args => registerLibrary(isolatedSystem, args));

  this.__originalSystem = window.SystemJS;

  this.system = {
    set: function(path, module) {
      const newModule = SystemJS.newModule(module);

      const normalizedPath = SystemJS.normalizeSync(path);

      // Delete any previously set modules in registry
      SystemJS.registry.delete(normalizedPath);

      // Also delete it in the actual records, since those take precedence over our defined
      // registration below
      delete SystemJS[Object.getOwnPropertySymbols(SystemJS)[0]].records[normalizedPath];

      SystemJS[Object.getOwnPropertySymbols(SystemJS)[0]].records[normalizedPath] = newModule;

      SystemJS.registry.set(path, newModule);
      SystemJS.registry.set(normalizedPath, newModule);

      return null;
    },
    reimport: function(path) {
      SystemJS.registry.delete(SystemJS.resolveSync(path));

      return SystemJS.import(SystemJS.resolveSync(path));
    },
    import: function(path) {
      return SystemJS.import(path);
    },
    override: async function(path, update) {
      const currentModule = await SystemJS.import(path);

      const newModule = Object.assign({}, currentModule, update);

      this.set(path, newModule);

      return null;
    }
  };

  window.SystemJS = isolatedSystem;
});

afterEach(function() {
  window.SystemJS = this.__originalSystem;
});

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
