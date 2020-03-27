const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');
const cypressPactPlugin = require('@contentful/cypress-pact/plugin');

module.exports = (on) => {
  on('file:preprocessor', cypressTypeScriptPreprocessor);
  cypressPactPlugin(on);
};
