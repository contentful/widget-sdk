/* global SystemJS */

SystemJS.config({
  baseURL: '/base',
  paths: {
    // Load node module served by karma.
    'npm:': '/base/node_modules/',
    // Convenience alias
    'helpers': 'test/helpers'
  },
  map: {
    '$q': 'test/helpers/$q'
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
