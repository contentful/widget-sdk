const path = require('path');

module.exports = {
  resolve: {
    // treat all folders in src as modules
    modules: [path.resolve(__dirname, '../../src/javascripts'), 'node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.json']
  }
};
