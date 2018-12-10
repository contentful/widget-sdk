const analyzers = require('./analyzers');
const attributes = require('./attributes');

module.exports = {
  analyzers: analyzers,
  attributes: attributes,
  exclude: /(node_modules|\.git|\.DS_Store|\.js\.snap)/
};
