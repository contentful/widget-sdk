const path = require('path');

module.exports = {
  resolve: {
    // treat all folders in src as modules
    modules: [path.resolve(__dirname, '../../src/javascripts'), 'node_modules'],
    // todo: use .ts, .tsx once TS is enabled
    // extensions: ['.ts', '.tsx', '.js', '.json'],
    extensions: ['.js', '.json'],
  },
};
