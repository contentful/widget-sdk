const cypressPactPlugin = require('@contentful/cypress-pact/plugin');

module.exports = (on) => {
  cypressPactPlugin(on);
};
