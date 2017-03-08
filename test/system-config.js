/* global SystemJS */

// A list of _static_ Angular services from the 'cf.libs' and 'cf.es6' modules
// that we want to expose in SystemJS
SystemJS.exposeFromAngular = [
  'libs/kefir', 'libs/sum-types', 'lodash'
];

SystemJS.config({
  baseURL: '/base',
  paths: {
    // Load node module served by karma.
    'npm:': '/base/node_modules/',
    // Convenience alias
    'helpers': 'test/helpers'
  },
  packageConfigPaths: [
    'npm:*/package.json'
  ],
  packages: {
    'npm:sinon': {
      main: 'pkg/sinon',
      format: 'amd'
    }
  }
});
