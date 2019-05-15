const Enzyme = require('enzyme');
const EnzymeAdapter = require('enzyme-adapter-react-16');
const ReactTestingLibrary = require('react-testing-library');
require('@babel/polyfill');
// https://github.com/FormidableLabs/enzyme-matchers
require('jest-dom/extend-expect');
require('jest-extended');

// Setup enzyme's react adapter
Enzyme.configure({ adapter: new EnzymeAdapter() });

// Configure React Testing Library to use `data-test-id`
// instead of the default `data-testid`
ReactTestingLibrary.configure({
  testIdAttribute: 'data-test-id'
});

// We shouldn't allow failed prop types in tests
const error = console.error;
console.error = (warning, ...args) => {
  if (/(Invalid prop|Failed prop type)/gi.test(warning)) {
    throw new Error(warning);
  }

  error.apply(console, [warning, ...args]);
};

// Do not allow uncaught promises
process.on('unhandledRejection', err => {
  throw err;
});

// Polyfills

global.requestAnimationFrame = cb => setTimeout(cb, 0);

if (global.document) {
  document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document
    },
    getBoundingClientRect: () => {
      return { right: 0 };
    },
    getClientRects: () => []
  });
}
