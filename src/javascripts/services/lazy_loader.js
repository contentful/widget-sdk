'use strict';

/**
 * @ngdoc service
 * @name LazyLoader
 *
 * @description
 * This service can be used to lazily load script dependencies.
 *
 * All the dependencies are defined in "LazyLoader/resources".
 * If we "own" a script that is lazy-load-enabled, we should call the function
 * window.cfFeedLazyLoader() with the script's name and an exported value.
 * If a script just adds a global value, define the "globalObject" property.
 */
angular.module('contentful')
.factory('LazyLoader', ['$injector', function ($injector) {
  var $q = $injector.get('$q');
  var $window = $injector.get('$window');
  var $rootScope = $injector.get('$rootScope');
  var loader = $injector.get('angularLoad');
  var resources = $injector.get('LazyLoader/resources');

  var store = {};
  var cache = {};

  $window.cfFeedLazyLoader = function (name, value) {
    $rootScope.$apply(function () {
      provide(name, value);
    });
  };

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
  function provide (name, value) {
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
  function get (name) {
    // no resource definition at all
    var resource = resources[name];
    if (!resource) {
      return $q.reject(new Error('No resource with requested name "' + name + '"'));
    }

    // use cached promise
    var cached = cache[name];
    if (cached) { return cached; }

    if (isStylesheet(resource)) {
      provide(name, $q.resolve());
    }

    // issue HTTP request to get service value
    var load = getLoaderFor(resource);
    var loadPromise = load(resource.url).then(function () {
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

  function getLoaderFor (resource) {
    return isStylesheet(resource) ? loader.loadCSS : loader.loadScript;
  }

  function isStylesheet (resource) {
    return resource.url.match(/\.css(?:\?.*)?$/);
  }
}])

.factory('LazyLoader/resources', ['$injector', function ($injector) {
  var AssetResolver = $injector.get('AssetResolver');
  var environment = $injector.get('environment');
  var Config = $injector.get('Config');

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
      url: '//fast.fonts.net/t/1.css?apiType=css&projectid=' +
        _.get(environment, 'settings.fonts_dot_com.project_id')
    },
    // JavaScript:
    markdown: {
      url: AssetResolver.resolve('app/markdown_vendors.js')
    },
    embedly: {
      url: 'https://cdn.embedly.com/widgets/platform.js',
      globalObject: 'embedly',
      setup: setupEmbedly
    },
    filepicker: {
      url: 'https://api.filepicker.io/v2/filepicker.js',
      globalObject: 'filepicker'
    },
    filepickerDebug: {
      url: 'https://api.filepicker.io/v1/filepicker_debug.js'
    },
    kaltura: {
      url: AssetResolver.resolve('app/kaltura.js'),
      globalObject: 'KalturaClient'
    },
    googleMaps: {
      url: 'https://maps.googleapis.com/maps/api/js?v=3&key=' +
        environment.settings.google.maps_api_key,
      globalObject: 'google.maps'
    },
    bugsnag: {
      url: 'https://d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js',
      globalObject: 'Bugsnag'
    },
    segment: {
      url: 'https://cdn.segment.com/analytics.js/v1/' +
        environment.settings.segment_io + '/analytics.min.js',
      globalObject: 'analytics'
    },
    snowplow: {
      url: AssetResolver.resolve('app/snowplow.js'),
      globalObject: 'Snowplow'
    },
    walkMeStaging: {
      url: 'https://cdn.walkme.com/users/0b7285ac5c8b4dee81eb418420f778c1/test/walkme_0b7285ac5c8b4dee81eb418420f778c1_https.js'
    },
    walkMeProd: {
      url: 'https://cdn.walkme.com/users/0b7285ac5c8b4dee81eb418420f778c1/walkme_0b7285ac5c8b4dee81eb418420f778c1_https.js'
    }
  };

  function setupEmbedly (embedly) {
    embedly('defaults', {
      cards: {
        key: environment.settings.embedly.api_key
      }
    });
    return embedly;
  }
}]);
