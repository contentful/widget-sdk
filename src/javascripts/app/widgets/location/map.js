'use strict';

angular.module('cf.app')
.factory('widgets/location/Map', ['$injector', function ($injector) {
  var LazyLoader = $injector.get('LazyLoader');
  var observeResize = $injector.get('ui/ResizeDetector').observeResize;
  var K = $injector.get('utils/kefir');

  return {
    init: init
  };

  function init (scope, mapSlotElement) {
    var destroyed = false;
    scope.$on('$destroy', function () {
      destroyed = true;
    });

    scope.isLoading = true;
    LazyLoader.get('googleMaps')
    .then(function (GMaps) {
      if (!destroyed) {
        scope.isLoading = false;
        initMap(scope, GMaps, mapSlotElement);
      }
    }, function () {
      scope.isLoading = false;
      scope.loadError = true;
    });
  }

  function initMap (scope, GMaps, mapSlotElement) {
    var map = new GMaps.Map(mapSlotElement, {
      scrollwheel: false,
      zoom: 6,
      center: {lat: 52.5018, lng: 13.41115439},
      mapTypeId: GMaps.MapTypeId.ROADMAP
    });

    K.onValueScope(scope, observeResize(mapSlotElement), function () {
      GMaps.event.trigger(map, 'resize');
    });

    var marker = new GMaps.Marker({
      map: map,
      position: map.getCenter(),
      draggable: true,
      visible: true
    });

    scope.$watch('isDisabled', function (isDisabled) {
      marker.setDraggable(!isDisabled);
    });

    scope.$watchCollection('location', function (location) {
      var latLng = toLatLng(location);
      if (latLng) {
        marker.setVisible(true);
        marker.setPosition(latLng);
        map.panTo(latLng);
      } else {
        marker.setVisible(false);
      }
    });

    GMaps.event.addListener(marker, 'dragend', function (event) {
      scope.$apply(function () {
        scope.location = fromLatLng(event.latLng);
        scope.search.updateAddressFromLocation();
      });
    });

    GMaps.event.addListener(map, 'click', function (event) {
      scope.$apply(function () {
        var latLng = event.latLng;
        if (!toLatLng(scope.location) && !scope.isDisabled) {
          marker.setPosition(latLng);
          scope.location = fromLatLng(latLng);
          scope.search.updateAddressFromLocation();
        }
      });
    });

    scope.$on('$destroy', function () {
      GMaps.event.clearInstanceListeners(map);
      GMaps.event.clearInstanceListeners(marker);
      map = null;
      marker = null;
    });
  }

  function fromLatLng (latLng) {
    if (latLng) {
      return { lat: latLng.lat(), lon: latLng.lng() };
    } else {
      return {};
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
