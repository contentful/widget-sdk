'use strict';

angular.module('cf.app')
.controller('LocationEditorSearchController', ['require', '$scope', function (require, $scope) {
  var $q = require('$q');
  var memoize = require('utils/memoize');
  var LazyLoader = require('LazyLoader');
  var Signal = require('signal');
  var throttle = require('throttle');

  var controller = this;
  var resultsAvailable = Signal.create();

  var ADDRESS_NOT_FOUND_ERROR = {
    code: 'address-not-found',
    message: 'Could not find address'
  };

  controller.onResultsAvailable = resultsAvailable.attach;

  controller.pick = result => {
    $scope.location = result.location;
    controller.address = result.address;
    controller.results = null;
  };

  controller.updateAddressFromLocation = () => {
    var latLng = toLatLng($scope.location);
    if (latLng) {
      controller.inProgress = true;
      geocode({location: latLng})
      .then(results => {
        if (results && results.length > 0) {
          controller.address = results[0].formatted_address;
        }
      }).finally(() => {
        controller.inProgress = false;
      });
    } else {
      controller.address = null;
    }
  };

  var searchAddress = addressSearcher(results => {
    if (results === null) {
      controller.results = null;
      controller.error = null;
    } else if (results.length === 0) {
      controller.results = null;
      controller.error = ADDRESS_NOT_FOUND_ERROR;
    } else {
      controller.results = convertResults(results);
      controller.error = null;
      resultsAvailable.dispatch();
    }
  }, error => {
    controller.results = null;
    controller.error = {
      code: 'address-search-failed',
      message: error.message
    };
  }, inProgress => {
    controller.inProgress = inProgress;
  });

  controller.search = () => {
    searchAddress(controller.address);
  };

  var getGeocoder = memoize(() => LazyLoader.get('googleMaps').then(GMaps => new GMaps.Geocoder()));

  function convertResults (rawResults) {
    return rawResults.map(result => ({
      location: {
        lat: result.geometry.location.lat(),
        lon: result.geometry.location.lng()
      },

      viewport: result.geometry.viewport,

      strippedLocation: {
        lat: result.geometry.location.lat().toString().slice(0, 8),
        lon: result.geometry.location.lng().toString().slice(0, 8)
      },

      address: result.formatted_address
    }));
  }

  function addressSearcher (onSuccess, onError, inProgress) {
    var lastQueryId = 0;
    var pending = 0;

    var throttledRun = throttle(run, 350);

    return address => {
      inProgress(true);
      throttledRun(address);
    };

    function run (address) {
      var queryId = ++lastQueryId;
      pending++;
      geocodeAddress(address)
      .then(result => {
        if (queryId === lastQueryId) {
          onSuccess(result);
        }
      }, error => {
        if (queryId === lastQueryId) {
          onError(error);
        }
      }).finally(() => {
        pending--;
        if (!pending) {
          inProgress(false);
        }
      });
    }
  }

  function geocode (query) {
    return getGeocoder()
    .then(geocoder => $q((resolve, reject) => {
      geocoder.geocode(query, resolve, reject);
    }));
  }

  function geocodeAddress (address) {
    if (address) {
      return geocode({address: address});
    } else {
      return $q.resolve(null);
    }
  }

  function toLatLng (location) {
    if (location && _.isNumber(location.lat) && _.isNumber(location.lon)) {
      return {lat: location.lat, lng: location.lon};
    } else {
      return null;
    }
  }
}]);
