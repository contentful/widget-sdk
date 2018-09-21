const Enzyme = require('enzyme');
const EnzymeAdapter = require('enzyme-adapter-react-16');
require('babel-polyfill');
require('jest-enzyme');

// Setup enzyme's react adapter
Enzyme.configure({ adapter: new EnzymeAdapter() });

// We shouldn't allow failed prop types in tests
const error = console.error;
console.error = (warning, ...args) => {
  if (/(Invalid prop|Failed prop type)/gi.test(warning)) {
    throw new Error(warning);
  }
  error.apply(console, [warning, ...args]);
};

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
