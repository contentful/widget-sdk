'use strict';

angular.module('contentful').directive('cfGoogleMaps', ['$injector', function ($injector) {
  var googleMapsLoader      = $injector.get('googleMapsLoader'),
      defer                 = $injector.get('defer'),
      MAP_DOM_ELEMENT_CLASS = '.google-map';

  return {
    restrict    : 'E',
    controller  : 'GoogleMapsController',
    controllerAs: 'googleMapsController',
    template    : JST['cf_google_maps'](),
    link        : function (scope, element) {
      googleMapsLoader.load().then(function (GMaps) {
        var locationController = element.find(MAP_DOM_ELEMENT_CLASS).controller('ngModel');

        /*
         * Center the map by default to a nicely zoomed out
         * Contentful HQ
         */
        var map = new GMaps.Map(element.find(MAP_DOM_ELEMENT_CLASS)[0], {
          zoom: 6,
          center: new GMaps.LatLng(52.5018, 13.41115439),
          mapTypeId: GMaps.MapTypeId.ROADMAP
        });
        var marker = new GMaps.Marker({
          map: map,
          position: map.getCenter(),
          draggable: true,
          visible: true
        });

        scope._getMap = function () {
          return map;
        };

        scope.$watch('locationValid', function (showMarker) {
          marker.setVisible(!!showMarker);
        });
        scope.$watch('otEditable', function(otEditable) {
          if (otEditable) {
            marker.setDraggable(true);
          } else {
            marker.setDraggable(false);
          }
        });

        var latLngParser = function(latLng) {
          if (latLng) {
            return { lat: latLng.lat(), lon: latLng.lng() };
          } else {
            return null;
          }
        };
        var locationFormatter = function(location) {
          if (location && scope.locationIsValid(location)) {
            return new GMaps.LatLng(location.lat, location.lon);
          } else {
            return null;
          }
        };

        locationController.$viewChangeListeners.push(scope.otBindInternalChangeHandler);
        locationController.$parsers.unshift(latLngParser);
        locationController.$formatters.push(locationFormatter);
        locationController.$render = function() {
          var latLng = locationController.$viewValue;
          if (latLng) {
            marker.setPosition(latLng);
            map.panTo(latLng);
          }
        };

        GMaps.event.addListener(map, 'click', mapClick);
        GMaps.event.addListener(marker, 'dragend', mapDrag);
        scope.$on('$destroy', function () {
          GMaps.event.clearInstanceListeners(map);
          GMaps.event.clearInstanceListeners(marker);
          map = null;
          marker = null;
        });


        scope.updateLocation = function(location) {
          scope.location = location;
          scope.otBindInternalChangeHandler();
        };

        function mapClick(event){
          if (!scope.location && scope.otEditable) {
            marker.setPosition(event.latLng);
            locationController.$setViewValue(event.latLng);
          }
        }

        function mapDrag(event){
          locationController.$setViewValue(event.latLng);
        }

        // Search Stuff /////////////////////////////////////////////////////////
        scope.$watch('selectedResult', function (result) {
          if (result) {
            moveMapToSelected();
            defer(scrollToSelected);
          }
        });

        function scrollToSelected() {
          var $selected = element.find('.selected');
          if ($selected.length === 0) return;
          var $container = element.find('.search-results');
          var above = $selected.prop('offsetTop') <= $container.scrollTop();
          var below = $container.scrollTop() + $container.height() <= $selected.prop('offsetTop');
          if (above) {
            $container.scrollTop($selected.prop('offsetTop'));
          } else if (below) {
            $container.scrollTop($selected.prop('offsetTop')-$container.height() + $selected.height());
          }
        }

        function moveMapToSelected() {
          var result = scope.selectedResult;
          map.fitBounds(result.viewport);
        }

        scope.pickResult = function(result) {
          scope.updateLocation(result.location);
          map.fitBounds(result.viewport);
          scope.searchTerm = '';
        };

        scope.resetMapLocation = function () {
          if(locationController.$viewValue instanceof GMaps.LatLng){
            map.panTo(locationController.$viewValue);
          }
        };
      });
    }
  };
}]);
