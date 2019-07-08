const analyzers = require('./analyzers');
const attributes = require('./attributes');

module.exports = {
  roots: ['src/javascripts', 'test'],
  analyzers: analyzers,
  attributes: attributes,
  exclude: /(node_modules|\.git|\.DS_Store|\.js\.snap)/
};
