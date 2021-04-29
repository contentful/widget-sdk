import 'react-app-polyfill/stable';
import text from '@contentful/sharejs/lib/types/text';
import '@contentful/sharejs/lib/types/text-api';
import json from '@contentful/sharejs/lib/types/json';
import '@contentful/sharejs/lib/types/json-api';
import { settings } from 'Config';

window.sharejs = {
  types: {
    text,
    json,
  },
};

import angular from 'angular';
import AngularInit from 'AngularInit';

// Angular deps
import 'angular-animate';
import 'angular-sanitize';
import 'angular-ui-router';

// CodeMirror: JSON field editor component
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/mode/javascript/javascript';
// CodeMirror: mixed HTML mode for UI Extension editor
import 'codemirror/mode/htmlmixed/htmlmixed';
import { FLAGS, getVariation } from 'LaunchDarkly';

import moment from 'moment';
import _ from 'lodash';
import qs from 'qs';

import { awaitInitReady } from 'core/NgRegistry';

import { initMonitoring } from 'core/monitoring';
initMonitoring();

// define global method for code splitting with static subdomain
window.WebpackRequireFrom_getChunkURL = () => settings.assetUrl + '/app/';

angular
  .module(`contentful/app-config`, [AngularInit, 'ngAnimate', 'ngSanitize', 'ui.router'])
  .config([
    '$locationProvider',
    ($locationProvider) => {
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false,
      });

      // This is not actually used but prevents gobbling of fragments in
      // the URL, like the authentication token passed by gatekeeper.
      $locationProvider.hashPrefix('!!!');
    },
  ])
  .config([
    '$compileProvider',
    ($compileProvider) => {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
    },
  ])
  .config([
    '$animateProvider',
    ($animateProvider) => {
      $animateProvider.classNameFilter(/animate/);
    },
  ])
  .config([
    '$urlMatcherFactoryProvider',
    ($urlMatcherFactory) => {
      /*
       * We need to define a dumb type PathSuffix here and use that to
       * represent path suffixes for the Space Settings and Account
       * views, because otherwise UI-Router treats them as regular
       * URL parameters and does nasty things like escaping slashes.
       */
      $urlMatcherFactory.type('PathSuffix', {
        encode: function (val) {
          return val !== null ? val.toString() : val;
        },
        decode: function (val) {
          return val !== null ? val.toString() : val;
        },
        is: function (val) {
          return this.pattern.test(val);
        },
        pattern: /.*/,
      });

      // Avoid being obsessive about matching states to trailing slashes
      $urlMatcherFactory.strictMode(false);
    },
  ])
  .config([
    '$provide',
    ($provide) => {
      // Decorates $q instances with the `callback` method
      $provide.decorator('$q', [
        '$delegate',
        '$rootScope',
        ($q, $rootScope) => {
          // Returns a callback method that should be passed in where a node-style callback is expected.
          // The callback method has a `promise` property that can then be passed around in a promise environment:
          //
          // var cb = $q.callback();
          // asyncMethod(cb);
          // cb.promise.then(...)
          //
          $q.callbackWithApply = () => {
            const deferred = $q.defer();
            const callbackFunction = function (err) {
              const args = _.tail(arguments);
              $rootScope.$apply(() => {
                if (err) {
                  deferred.reject(err);
                } else {
                  deferred.resolve(...args);
                }
              });
            };
            callbackFunction.promise = deferred.promise;
            return callbackFunction;
          };

          $q.callback = () => {
            const deferred = $q.defer();
            const callbackFunction = function (err) {
              const args = _.tail(arguments);
              if (err) {
                deferred.reject(err);
              } else {
                deferred.resolve(...args);
              }
            };
            callbackFunction.promise = deferred.promise;
            return callbackFunction;
          };

          /**
           * Usage:
           *
           * $q.denodeify(function (cb) {
           *   expectsNodeStyleCallback(cb)
           * })
           * .then(
           *   function (result) {},
           *   function (err) {})
           * )
           */
          $q.denodeify = (fn) =>
            $q((resolve, reject) => {
              try {
                fn(handler);
              } catch (error) {
                handler(error);
              }

              function handler(err, value) {
                if (err) {
                  reject(err);
                } else {
                  resolve(value);
                }
              }
            });

          return $q;
        },
      ]);
    },
  ])
  .config([
    '$stateProvider',
    ($stateProvider) => {
      $stateProvider.decorator('parent', function (internalStateObj, parentFn) {
        // This fn is called by StateBuilder each time a state is registered
        // The first arg is the internal state. Capture it and add an accessor to public state object.
        internalStateObj.self.$$state = function () {
          return internalStateObj;
        };

        // pass through to default .parent() function
        return parentFn(internalStateObj);
      });
    },
  ]);

angular
  .module(`contentful/app`, [`contentful/app-config`])
  .config([
    '$compileProvider',
    ($compileProvider) => {
      if (process.env.NODE_ENV !== 'development') {
        $compileProvider.debugInfoEnabled(false);
      }
    },
  ])

  .run([
    '$state',
    async ($state) => {
      await awaitInitReady();

      const Config = await import(/* webpackMode: "eager" */ 'Config');
      const { default: handleGKMessage } = await import(
        /* webpackMode: "eager" */ 'account/handleGatekeeperMessage'
      );
      const { init: initDebug } = await import(/* webpackMode: "eager" */ './Debug');
      const { init: initAuthentication } = await import(
        /* webpackMode: "eager" */ 'Authentication'
      );
      const { init: initTokenStore } = await import(
        /* webpackMode: "eager" */ 'services/TokenStore'
      );

      const { init: initBackendTracing } = await import(
        /* webpackMode: "eager" */ 'i13n/BackendTracing'
      );
      const Telemetry = await import(/* webpackMode: "eager" */ 'i13n/Telemetry');
      const { loadAll: loadAllStates } = await import(/* webpackMode: "eager" */ 'states/states');
      const { go } = await import(/* webpackMode: "eager" */ 'states/Navigator');
      const { init: initExtentionActivationTracking } = await import(
        /* webpackMode: "eager" */
        'widgets/ExtensionActivationTracking'
      );

      const { initDialogsController } = await import(
        /* webpackMode: "eager" */ 'components/client/dialogsInitController'
      );

      const { setupStateChangeHandlers } = await import(
        /* webpackMode: "eager" */ 'navigation/stateChangeHandlers'
      );

      const { ensureFlagsHaveFallback } = await import(/* webpackMode: "eager" */ 'LaunchDarkly');
      const { init: initDegradedAppPerformance } = await import(
        /* webpackMode: "eager" */ 'core/services/DegradedAppPerformance'
      );

      if (Config.env === 'development') {
        Error.stackTraceLimit = 100;
      } else {
        Error.stackTraceLimit = 25;
      }

      loadAllStates();
      initDebug(window);
      initBackendTracing();
      initTokenStore();
      initExtentionActivationTracking();
      initDegradedAppPerformance();
      const willRedirect = initAuthentication();

      initDialogsController();
      setupStateChangeHandlers();

      ensureFlagsHaveFallback();

      // Start telemetry and expose it as a global.
      // It can be used by E2E or Puppeteer scripts.
      window.cfTelemetry = Telemetry;
      Telemetry.init();

      // We want to request this flag as early as possible,
      // to later access the cached value in src/javascripts/data/Request
      getVariation(FLAGS.REQUEST_RETRY_EXPERIMENT);

      moment.updateLocale('en', {
        calendar: {
          lastDay: '[Yesterday], LT',
          sameDay: '[Today], LT',
          nextDay: '[Tomorrow], LT',
          lastWeek: 'ddd, LT',
          nextWeek: '[Next] ddd, LT',
          sameElse: 'll',
        },
      });

      // Listen to postMessage events and check if they are coming from
      // GK iframes. If so, handle messages accordingly
      const { authUrl } = settings;

      const cb = (evt) => {
        if (evt.origin === authUrl) {
          handleGKMessage(evt.data);
        }
      };
      window.addEventListener('message', cb);

      if (willRedirect) {
        angular.module('contentful/app').loaded = true;
        return;
      }

      // Due to the async loading, we need to take the route above and attempt
      // to route to it
      let matchFound = false;

      for (const state of $state.get()) {
        if (!state.$$state || state.abstract) {
          continue;
        }

        // Stop looping after the first match
        if (matchFound) {
          break;
        }

        const { url } = state.$$state();
        const queryParams = qs.parse(window.location.search.substr(1));
        const matchedParams = url.exec(window.location.pathname, queryParams);

        if (matchedParams) {
          matchFound = true;
          try {
            go({
              path: state.name.split('.'),
              params: matchedParams,
              options: { location: false },
            });
          } finally {
            angular.module('contentful/app').loaded = true;
          }
        }
      }
    },
  ]);
