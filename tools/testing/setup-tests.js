const Enzyme = require('enzyme');
const EnzymeAdapter = require('enzyme-adapter-react-16');
const ReactTestingLibrary = require('@testing-library/react');
require('@babel/polyfill');
// https://github.com/FormidableLabs/enzyme-matchers
require('jest-enzyme');
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
  // todo: remove once we upgrade to react-dom@16.9.0
  // https://github.com/testing-library/react-testing-library/issues/281
  if (/Warning.*not wrapped in act/.test(warning)) {
    return;
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
