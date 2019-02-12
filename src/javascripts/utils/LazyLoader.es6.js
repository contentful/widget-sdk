import { get as getAtPath } from 'lodash';
import * as Config from 'Config.es6';

// This service can be used to lazily load scripts from CDNs.

// WARNING:
// If you need to use it from Angular it's on you to make
// Angular aware of a script being loaded:
//
// WRONG!
// LazyLoader.get('x').then(x => $scope.x = x)
//
// GOOD:
// LazyLoader.get('x').then(x => {
//   $scope.x = x;
//   $scope.$applyAsync();
// })
//
// List of resources that can be lazily loaded.
//
// Options:
// - `url` - required CDN URL.
// - `globalObject` - optional path to the global object of a script.
// - `setup` - optional function to run immediately after the resource is loaded.
const RESOURCES = {
  embedly: {
    url: 'https://cdn.embedly.com/widgets/platform.js',
    globalObject: ['embedly'],
    setup: embedly => {
      embedly('defaults', {
        cards: {
          key: Config.services.embedly.api_key
        }
      });
      return embedly;
    }
  },
  googleMaps: {
    url: 'https://maps.googleapis.com/maps/api/js?v=3&key=' + Config.services.google.maps_api_key,
    globalObject: ['google', 'maps']
  },
  bugsnag: {
    url: 'https://d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js',
    globalObject: ['Bugsnag']
  },
  segment: {
    url:
      'https://cdn.segment.com/analytics.js/v1/' + Config.services.segment_io + '/analytics.min.js',
    globalObject: ['analytics']
  },
  snowplow: {
    // This is a special CDN version prepared for us by Snowplow.
    // It's less likely to be marked as tracking script by ad blockers.
    url: 'https://d3unofs9w5amk7.cloudfront.net/Sp4yK8ZCFcVrSMi44LjI.js',
    globalObject: ['Snowplow']
  },
  walkMeStaging: {
    url:
      'https://cdn.walkme.com/users/cf344057732941ed81018bf903986da9/test/walkme_cf344057732941ed81018bf903986da9_https.js'
  },
  walkMeProd: {
    url:
      'https://cdn.walkme.com/users/cf344057732941ed81018bf903986da9/walkme_cf344057732941ed81018bf903986da9_https.js'
  },
  PubNub: {
    url: 'https://cdn.pubnub.com/sdk/javascript/pubnub.4.21.6.js',
    globalObject: ['PubNub']
  }
};

Object.keys(RESOURCES).forEach(key => {
  const { url, globalObject, setup } = RESOURCES[key];

  const validUrl = typeof url === 'string' && url.length > 0;
  const validGlobalObject =
    typeof globalObject === 'undefined' || (Array.isArray(globalObject) && globalObject.length > 0);
  const validSetup = ['undefined', 'function'].includes(typeof setup);
  const valid = validUrl && validGlobalObject && validSetup;

  if (!valid) {
    throw new Error(`Invalid resource definition for "${key}"`);
  }
});

const store = {};
const cache = {};

// Lazy load the script with the given name.
// This method returns a promise its global object (if available).
// It will be rejected if the requested resource is not registered
// or failed while loading.
export function get(name) {
  const resource = RESOURCES[name];

  // No resource definition at all.
  if (!resource) {
    return Promise.reject(new Error(`No "${name}" resource registered.`));
  }

  // Use a cached promise.
  const cached = cache[name];
  if (cached) {
    return cached;
  }

  // Load the script.
  const loadPromise = load(resource.url).then(() => {
    if (resource.globalObject) {
      store[name] = getAtPath(window, resource.globalObject);
    }

    if (typeof resource.setup === 'function') {
      return resource.setup(store[name]);
    } else {
      return store[name];
    }
  });

  cache[name] = loadPromise;

  return loadPromise;
}

function load(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = url;

    script.onerror = () => reject(new Error(`Failed to load ${url}.`));
    script.onload = () => resolve();

    document.getElementsByTagName('head')[0].appendChild(script);
  });
}

const globalStore = {};

export function getFromGlobal(globalObject) {
  const stored = globalStore[globalObject];
  if (stored) {
    return Promise.resolve(stored);
  }

  const deferred = {};
  deferred.promise = new Promise(resolve => {
    deferred.resolve = resolve;
  });

  pollForService(globalObject, deferred);

  return deferred.promise;
}

function pollForService(globalObject, deferred) {
  const service = window[globalObject];

  if (service) {
    globalStore[globalObject] = service;
    deferred.resolve(service);
  } else {
    setTimeout(() => pollForService(globalObject, deferred), 1000);
  }
}
