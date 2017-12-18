/* global SystemJS */

// A list of _static_ Angular services from the 'cf.libs' and 'cf.es6' modules
// that we want to expose in SystemJS
SystemJS.exposeFromAngular = [
  'create-react-class',
  'libs/color',
  'libs/qs',
  'environment',
  'libs/downshift',
  'libs/kefir',
  'libs/sum-types',
  'lodash',
  'jquery',
  'libs/react-click-outside',
  'libs/react-dom/test-utils',
  'libs/enzyme',
  'libs/enzyme-adapter-react-16',
  'libs/sum-types/caseof-eq',
  'libs/react',
  'libs/react-dom',
  'libs/prop-types'
];

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
