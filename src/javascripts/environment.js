'use strict';

/**
 * @ngdoc service
 * @name environment
 * @description
 * Exposes configuration for the application that depends on the envrionment
 *
 * Uses `window.CF_ENV`, `window.CF_CONFIG`, `window.CF_UI_VERSION` to load the
 * configuration.
 */
angular.module('contentful/environment', [])
.constant('environment', (function () {
  /**
   *
   * @ngdoc property
   * @name environment#env
   * @type {string}
   * @description
   * Current environment name.
   *
   * Possible values are `development`, `procuction`, and `staging` (used on the
   * `quirely.com` and `flinkly.com` domains.
   *
   * The tests also use the `unittest` value.
   */
  var env = window.CF_ENV ? window.CF_ENV : 'development';

  var isDev = env === 'development';
  var settings = window.CF_CONFIG || {};
  var gitRevision = window.CF_UI_VERSION;

  _.extend(settings, {
    // for sceDelegateProvider
    resourceUrlWhiteListRegexp: makeResourceUrlList(
      [settings.asset_host, settings.main_domain]
      .concat(settings.additional_domains)
    ),

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

  function makeResourceUrlList (hosts) {
    var domains = _(hosts)
      .compact()
      .map(function (domain) {
        return domain.replace('.', '\\.').replace(/:\d+$/, '');
      })
      .uniq()
      .value()
      .join('|');
    return [
      new RegExp('^(https?:)?//([^:/.?&;]*\\.)?(' + domains + ')(:\\d+)?(/.*|$)'),
      'self'
    ];
  }
}()));
