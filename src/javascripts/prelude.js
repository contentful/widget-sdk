/**
 * This file defines the System.register function that is used to
 * register ES6 modules.
 *
 * We also declare all the legacy Angular modules and provide their
 * configuration.
 */

'use strict';

import angular from 'angular';
import AngularInit from 'AngularInit';

// Angular deps
import 'angular-animate';
import 'angular-sanitize';
import 'angular-ui-router';

import '@babel/polyfill';

// Polyfill for Element.closest used to support Slatejs in IE.
import 'element-closest';

// CodeMirror: JSON field editor component
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/mode/javascript/javascript';
// CodeMirror: Markdown field editor component
import 'codemirror/mode/markdown/markdown';
// CodeMirror: HTML highlighting inside Markdown
import 'codemirror/mode/xml/xml';
import 'codemirror/addon/edit/continuelist';
import 'codemirror/addon/mode/overlay';
// CodeMirror: mixed HTML mode for UI Extension editor
import 'codemirror/mode/htmlmixed/htmlmixed';

import moment from 'moment';
import _ from 'lodash';

import * as Config from 'Config.es6';
import handleGKMessage from 'account/handleGatekeeperMessage.es6';

import { init as initDebug } from 'Debug.es6';
import { init as initAuthentication } from 'Authentication.es6';
import { init as initTokenStore } from 'services/TokenStore.es6';
import { init as initLD } from 'utils/LaunchDarkly/index.es6';
import { init as initAutoCreateNewSpace } from 'components/shared/auto_create_new_space/index.es6';
import { init as initExtentionActivationTracking } from 'widgets/ExtensionActivationTracking.es6';
import initContextMenuHandler from 'ui/ContextMenuHandler.es6';
import { loadAll as loadAllStates } from 'states/states.es6';

import * as Telemetry from 'i13n/Telemetry.es6';

const injectedConfig = readInjectedConfig();
const env = injectedConfig.config.environment;
const gitRevision = injectedConfig.uiVersion;

// define global method for code splitting with static subdomain
window.WebpackRequireFrom_getChunkURL = () => injectedConfig.config.assetUrl + '/app/';

function readInjectedConfig() {
  // TODO Should throw when config is not injected, but currently required for tests
  const defaultValue = { config: { environment: 'development' } };
  const el = document.querySelector('meta[name="external-config"]');

  try {
    return JSON.parse(el.getAttribute('content')) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

angular
  .module('contentful/app', [AngularInit, 'ngAnimate', 'ngSanitize', 'ui.router'])
  .config([
    '$locationProvider',
    $locationProvider => {
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      });

      // This is not actually used but prevents gobbling of fragments in
      // the URL, like the authentication token passed by gatekeeper.
      $locationProvider.hashPrefix('!!!');
    }
  ])

  .config([
    '$compileProvider',
    $compileProvider => {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|contentful):/);
    }
  ])
  .config([
    '$animateProvider',
    $animateProvider => {
      $animateProvider.classNameFilter(/animate/);
    }
  ])
  .config([
    '$urlMatcherFactoryProvider',
    $urlMatcherFactoryProvider => {
      /*
       * We need to define a dumb type PathSuffix here and use that to
       * represent path suffixes for the Space Settings and Account
       * views, because otherwise UI-Router treats them as regular
       * URL parameters and does nasty things like escaping slashes.
       */
      $urlMatcherFactoryProvider.type('PathSuffix', {
        encode: function(val) {
          return val !== null ? val.toString() : val;
        },
        decode: function(val) {
          return val !== null ? val.toString() : val;
        },
        is: function(val) {
          return this.pattern.test(val);
        },
        pattern: /.*/
      });

      // Avoid being obsessive about matching states to trailing slashes
      $urlMatcherFactoryProvider.strictMode(false);
    }
  ])
  .config([
    '$provide',
    $provide => {
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
            const callbackFunction = function(err) {
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
            const callbackFunction = function(err) {
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
          $q.denodeify = fn =>
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
        }
      ]);
    }
  ])
  .config([
    '$httpProvider',
    $httpProvider => {
      // IE11 caches AJAX requests by default :facepalm: if we don’t set
      // these headers.
      // See: http://viralpatel.net/blogs/ajax-cache-problem-in-ie/
      $httpProvider.defaults.headers.common['Cache-Control'] = 'no-cache';
      $httpProvider.defaults.headers.common['If-Modified-Since'] = '0';

      // Add header to denote UI traffic, so that information can be determined
      // in services like Librato
      //
      // See [CEP-0056] SDK User Agent Headers
      // https://contentful.atlassian.net/wiki/spaces/ENG/pages/122514052/CEP-0056+SDK+User+Agent+Headers
      const headerParts = ['app contentful.web-app', 'platform browser'];

      // Add active git revision to headers
      if (gitRevision) {
        headerParts.push(`sha ${gitRevision}`);
      }

      // Add environment, so that local dev versus direct traffic can be differentiated
      if (env !== 'production') {
        headerParts.push(`env ${env}`);
      }

      $httpProvider.defaults.headers.common['X-Contentful-User-Agent'] = headerParts.join('; ');
    }
  ])
  .config([
    '$compileProvider',
    $compileProvider => {
      if (env !== 'development') {
        $compileProvider.debugInfoEnabled(false);
      }
    }
  ])

  .run([
    'dialogsInitController',
    'navigation/stateChangeHandlers',
    ({ init: initDialogs }, { setup: setupStateChangeHandlers }) => {
      if (Config.env === 'development') {
        Error.stackTraceLimit = 100;
      } else {
        Error.stackTraceLimit = 25;
      }

      initDebug(window);
      initAuthentication();
      initTokenStore();
      initLD();
      initAutoCreateNewSpace();
      initContextMenuHandler();
      initExtentionActivationTracking();
      loadAllStates();

      setupStateChangeHandlers();
      initDialogs();

      // Start telemetry and expose it as a global.
      // It can be used by E2E or Puppeteer scripts.
      window.cfTelemetry = Telemetry;
      Telemetry.init();

      moment.locale('en', {
        calendar: {
          lastDay: '[Yesterday], LT',
          sameDay: '[Today], LT',
          nextDay: '[Tomorrow], LT',
          lastWeek: 'ddd, LT',
          nextWeek: '[Next] ddd, LT',
          sameElse: 'll'
        }
      });
    }
  ])
  // Listen to postMessage events and check if they are coming from
  // GK iframes. If so, handle messages accordingly
  .run(() => {
    const {
      config: { authUrl }
    } = Config.readInjectedConfig();
    const cb = evt => {
      if (evt.origin.includes(authUrl)) {
        handleGKMessage(evt.data);
      }
    };
    window.addEventListener('message', cb);
  });
