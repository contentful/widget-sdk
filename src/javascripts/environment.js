'use strict';

/**
 * @ngdoc service
 * @name environment
 * @description
 * Exposes configuration for the application that depends on the envrionment
 *
 * Uses `window.CF_CONFIG` and `window.CF_UI_VERSION` to load the configuration.
 */
angular.module('contentful/environment')
.constant('environment', (function () {
  // TODO Should throw when CF_CONFIG is undefined, but currently required for tests
  var settings = window.CF_CONFIG || {};
  /**
   *
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
  var env = settings.environment;
  var isDev = env === 'development';
  var gitRevision = window.CF_UI_VERSION;

  _.extend(settings, {
    /**
     * @ngdoc property
     * @name environment#settings.disableUpdateCheck.
     * @type {boolean}
     * @description
     * If not set, query the API for the currently available version of the app
     * and display a notification if a newer version is available.
     *
     * It defaults to `false` and is set to `true` in the development
     * environment.
     *
     * Used in 'ClientController'.
     */
    disableUpdateCheck: isDev
  });

  return {
    env: env,
    settings: settings,
    gitRevision: gitRevision,
    manifest: window.CF_MANIFEST || {}
  };
}()));
