'use strict';

/**
 * @ngdoc service
 * @name environment
 * @description
 * Exposes configuration for the application that depends on the envrionment
 *
 * Uses content of <meta name="external-config" content="..."> element.
 *
 * TODO This service should be replaced by the 'Config' service
 */
angular.module('contentful/environment')
.constant('environment', (function () {
  var injected = extractInjectedConfig();

  /**
   * @ngdoc property
   * @name environment#env
   * @type {string}
   * @description
   * Current environment name.
   *
   * Possible values are `development`, `production`, and `staging` (used on the
   * `quirely.com` and `flinkly.com` domains.
   *
   * The tests also use the `unittest` value.
   */
  return {
    env: injected.config.environment,
    settings: injected.config,
    gitRevision: injected.uiVersion
  };

  function extractInjectedConfig () {
    // TODO Should throw when config is not injected, but currently required for tests
    var defaultValue = {config: {environment: 'development'}};
    var el = document.querySelector('meta[name="external-config"]');

    try {
      return JSON.parse(el.getAttribute('content')) || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
}()));
