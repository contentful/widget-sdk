const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { minify } = require('html-minifier');

/**
 * @usage
 * var htmlString = render(version, config, manifest)
 *
 * @description
 * Returns a configured HTML index file as string. No further
 * processing is needed to run this file in the given environment.
 *
 * The `manifest` maps asset paths to their fingerprinted version. It is used
 * to resolve all `src` and `href` properties. For example:
 * ~~~js
 * {
 *   "app/application.js": "app/application-3ef9a.js"
 * }
 * ~~~
 *
 * All `uiVersion`, `config` and resolved `manifest` are put together and
 * exposed as content of <meta name="external-config" content="..."> element.
 *
 * @param {string} uiVersion
 * @param {object} config
 * @param {function} manifest
 */
module.exports.render = function render(uiVersion, config, manifest) {
  const templatePath = path.resolve(__dirname, '..', '..', 'index.html');
  const template = fs.readFileSync(templatePath).toString();

  const externalConfig = JSON.stringify({
    uiVersion,
    config
  });

  const compiled = _.template(template)({
    manifest,
    externalConfig
  });

  return minify(compiled, {
    collapseWhitespace: true
  });
};
