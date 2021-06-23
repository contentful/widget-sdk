import 'react-app-polyfill/stable';
import { settings } from 'Config';

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

import * as Config from 'Config';
import handleGatekeeperMessage from 'account/handleGatekeeperMessage';
import { init as initDebug } from './Debug';
import { init as initAuthentication } from './Authentication';
import { init as initTokenStore } from 'services/TokenStore';
import { init as initBackendTracing } from 'i13n/BackendTracing';
import { init as initExtentionActivationTracking } from 'widgets/ExtensionActivationTracking';
import { initDialogsController } from 'components/client/dialogsInitController';
import { setupStateChangeHandlers } from 'navigation/stateChangeHandlers';
import * as Telemetry from 'i13n/Telemetry';
import { loadAll as loadAllStates } from 'states/states';
import { init as initDegradedAppPerformance } from 'core/services/DegradedAppPerformance';
import { FLAGS, getVariation, ensureFlagsHaveFallback } from 'core/feature-flags';

import moment from 'moment';
import _ from 'lodash';

import { initMonitoring } from 'core/monitoring';
initMonitoring();

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
      // Avoid being obsessive about matching states to trailing slashes
      $urlMatcherFactory.strictMode(false);
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
    () => {
      if (Config.env === 'development') {
        Error.stackTraceLimit = 100;
      } else {
        Error.stackTraceLimit = 25;
      }

      const willReloadWithDebug = initDebug(window);
      if (willReloadWithDebug) {
        return;
      }

      loadAllStates();
      initBackendTracing();
      initTokenStore();
      initExtentionActivationTracking();
      initDegradedAppPerformance();

      initAuthentication();

      initDialogsController();
      setupStateChangeHandlers();

      ensureFlagsHaveFallback();

      Telemetry.init();

      // We want to request this flag as early as possible,
      // to later access the cached value in src/javascripts/data/Request
      getVariation(FLAGS.REQUEST_RETRY_EXPERIMENT);

      // Listen to postMessage events and check if they are coming from
      // GK iframes. If so, handle messages accordingly
      const { authUrl } = settings;

      const cb = (evt) => {
        if (evt.origin === authUrl) {
          handleGatekeeperMessage(evt.data);
        }
      };
      window.addEventListener('message', cb);

      angular.module('contentful/app').loaded = true;
    },
  ]);
