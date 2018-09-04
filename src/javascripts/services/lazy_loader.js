'use strict';

/**
 * @ngdoc service
 * @name LazyLoader
 *
 * @description
 * This service can be used to lazily load script dependencies.
 * All the dependencies are defined in "LazyLoader/resources".
 */
angular
  .module('contentful')
  .factory('LazyLoader', [
    'require',
    require => {
      var $q = require('$q');
      var loader = require('angularLoad');
      var resources = require('LazyLoader/resources');

      var store = {};
      var cache = {};

      return {
        provide: provide,
        get: get
      };

      /**
       * @ngdoc method
       * @name LazyLoader#provide
       * @param {string} name
       * @param {*} value
       * @description
       * Feed Lazy Loader with the value for the given name.
       * There's no way to override already registered value.
       */
      function provide(name, value) {
        store[name] = store[name] || value;
      }

      /**
       * @ngdoc method
       * @name LazyLoader#get
       * @param {string} name
       * @return {Promise<*>}
       * @description
       * Lazy load the value with the given name.
       * This method returns promise of this value.
       * It will be rejected if requested resource:
       * - is not registered,
       * - failed loading,
       * - loaded, but extracting value wasn't possible.
       */
      function get(name) {
        // no resource definition at all
        var resource = resources[name];
        if (!resource) {
          return $q.reject(new Error('No resource with requested name "' + name + '"'));
        }

        // use cached promise
        var cached = cache[name];
        if (cached) {
          return cached;
        }

        if (isStylesheet(resource)) {
          provide(name, $q.resolve());
        }

        // issue HTTP request to get service value
        var load = getLoaderFor(resource);
        var loadPromise = load(resource.url).then(() => {
          if (resource.globalObject) {
            store[name] = _.get(window, resource.globalObject);
          }

          var value = store[name];

          // Immediately run any setup scripts if available
          if (_.isFunction(resource.setup)) {
            value = resource.setup(value);
          }

          return value || $q.reject(new Error('Script loaded, but no value provided.'));
        });

        cache[name] = loadPromise;
        return loadPromise;
      }

      function getLoaderFor(resource) {
        return isStylesheet(resource) ? loader.loadCSS : loader.loadScript;
      }

      function isStylesheet(resource) {
        return resource.url.match(/\.css(?:\?.*)?$/);
      }
    }
  ])

  .factory('LazyLoader/resources', [
    'require',
    require => {
      var environment = require('environment');
      var Config = require('Config.es6');

      /**
       * Options:
       * - url - absolute (in rare cases can be relative) URL
       * - globalObject - if resource registers itself by global value,
       *                  it should be a key name within window object
       * - setup - optional function run immediately after the resource is loaded
       */
      return {
        // CSS:
        gkPlanCardStyles: {
          url: Config.authUrl('/gatekeeper/plan_cards.css')
        },
        fontsDotCom: {
          url:
            '//fast.fonts.net/t/1.css?apiType=css&projectid=' +
            _.get(environment, 'settings.fonts_dot_com.project_id')
        },
        // JavaScript:
        embedly: {
          url: 'https://cdn.embedly.com/widgets/platform.js',
          globalObject: 'embedly',
          setup: setupEmbedly
        },
        filestack: {
          url: 'https://static.filestackapi.com/v3/filestack-0.11.1.js',
          globalObject: 'filestack'
        },
        googleMaps: {
          url:
            'https://maps.googleapis.com/maps/api/js?v=3&key=' +
            environment.settings.google.maps_api_key,
          globalObject: 'google.maps'
        },
        bugsnag: {
          url: 'https://d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js',
          globalObject: 'Bugsnag'
        },
        segment: {
          url:
            'https://cdn.segment.com/analytics.js/v1/' +
            environment.settings.segment_io +
            '/analytics.min.js',
          globalObject: 'analytics'
        },
        snowplow: {
          // This is a special CDN version prepared for us by Snowplow.
          // It's less likely to be marked as tracking script by ad blockers.
          url: 'https://d3unofs9w5amk7.cloudfront.net/Sp4yK8ZCFcVrSMi44LjI.js',
          globalObject: 'Snowplow'
        },
        walkMeStaging: {
          url:
            'https://cdn.walkme.com/users/cf344057732941ed81018bf903986da9/test/walkme_cf344057732941ed81018bf903986da9_https.js'
        },
        walkMeProd: {
          url:
            'https://cdn.walkme.com/users/cf344057732941ed81018bf903986da9/walkme_cf344057732941ed81018bf903986da9_https.js'
        }
      };

      function setupEmbedly(embedly) {
        embedly('defaults', {
          cards: {
            key: environment.settings.embedly.api_key
          }
        });
        return embedly;
      }
    }
  ]);
