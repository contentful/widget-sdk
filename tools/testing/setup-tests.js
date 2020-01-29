const Enzyme = require('enzyme');
const EnzymeAdapter = require('enzyme-adapter-react-16');
const ReactTestingLibrary = require('@testing-library/react');
require('@babel/polyfill');
require('jest-extended');
require('@testing-library/jest-dom/extend-expect');

// Setup enzyme's react adapter
Enzyme.configure({ adapter: new EnzymeAdapter() });

// Configure React Testing Library to use `data-test-id`
// instead of the default `data-testid`
ReactTestingLibrary.configure({
  testIdAttribute: 'data-test-id'
});

// We shouldn't allow failed prop types in tests
const error = console.error;
const warning = console.warn;

console.warn = (message, ...args) => {
  // will deal with all deprecated methods once we upgrade to React 17
  // right now it creates a noice rather than helps
  if (
    message.includes('componentWillMount has been renamed') ||
    message.includes('componentWillReceiveProps has been renamed') ||
    message.includes('componentWillUpdate has been renamed')
  ) {
    return;
  }

  warning.apply(console, [message, ...args]);
};

console.error = (message, ...args) => {
  // SVG specific warnings. These don't happen in reality because we use a loader for Webpack,
  // but in Jest we don't use that loader and so we get these warnings from React.
  if (/is using incorrect casing/.test(message) && /.*\.svg/.test(args[0])) {
    return;
  }

  if (/is unrecognized in this browser/.test(message) && /.*\.svg/.test(args[0])) {
    return;
  }

  if (
    message.includes('componentWillMount has been renamed') ||
    message.includes('componentWillReceiveProps has been renamed')
  ) {
    return;
  }

  error.apply(console, [message, ...args]);

  if (/(Invalid prop|Failed prop type)/gi.test(message)) {
    throw new Error(message);
  }
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
