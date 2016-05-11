'use strict';

angular.module('cf.app')
.controller('LocationEditorSearchController', ['$injector', '$scope', function ($injector, $scope) {
  var $q = $injector.get('$q');
  var memoize = $injector.get('utils/memoize');
  var LazyLoader = $injector.get('LazyLoader');
  var Signal = $injector.get('signal');
  var throttle = $injector.get('throttle');

  var controller = this;
  var resultsAvailable = Signal.create();

  var ADDRESS_NOT_FOUND_ERROR = {
    code: 'address-not-found',
    message: 'Could not find address'
  };

  controller.onResultsAvailable = resultsAvailable.attach;

  controller.pick = function (result) {
    $scope.location = result.location;
    controller.address = result.address;
    controller.results = null;
  };

  controller.updateAddressFromLocation = function () {
    var latLng = toLatLng($scope.location);
    if (latLng) {
      controller.inProgress = true;
      geocode({location: latLng})
      .then(function (results) {
        if (results && results.length > 0) {
          controller.address = results[0].formatted_address;
        }
      }).finally(function () {
        controller.inProgress = false;
      });
    } else {
      controller.address = null;
    }
  };

  var searchAddress = addressSearcher(function (results) {
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
  }, function (error) {
    controller.results = null;
    controller.error = {
      code: 'address-search-failed',
      message: error.message
    };
  }, function (inProgress) {
    controller.inProgress = inProgress;
  });

  controller.search = function () {
    searchAddress(controller.address);
  };

  var getGeocoder = memoize(function () {
    return LazyLoader.get('googleMaps').then(function (GMaps) {
      return new GMaps.Geocoder();
    });
  });

  function convertResults (rawResults) {
    return rawResults.map(function (result) {
      return {
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
      };
    });
  }

  function addressSearcher (onSuccess, onError, inProgress) {
    var lastQueryId = 0;
    var pending = 0;

    var throttledRun = throttle(run, 350);

    return function (address) {
      inProgress(true);
      throttledRun(address);
    };

    function run (address) {
      var queryId = ++lastQueryId;
      pending++;
      geocodeAddress(address)
      .then(function (result) {
        if (queryId === lastQueryId) {
          onSuccess(result);
        }
      }, function (error) {
        if (queryId === lastQueryId) {
          onError(error);
        }
      }).finally(function () {
        pending--;
        if (!pending) {
          inProgress(false);
        }
      });
    }
  }

  function geocode (query) {
    return getGeocoder()
    .then(function (geocoder) {
      return $q(function (resolve, reject) {
        geocoder.geocode(query, resolve, reject);
      });
    });
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
