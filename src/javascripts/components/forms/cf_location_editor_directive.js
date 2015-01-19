'use strict';

angular.module('contentful').directive('cfLocationEditor', ['$injector', function($injector){
  var defer        = $injector.get('defer');
  var notification = $injector.get('notification');
  var $window      = $injector.get('$window');

  return {
    restrict: 'C',
    require: 'ngModel',
    template: JST['cf_location_editor'],
    controller: 'cfLocationEditorController',
    link: function(scope, elm) {
      scope.$watch('location && locationValid', function (showMarker) {
        marker.setVisible(!!showMarker);
      });

      if(!$window.google){
        notification.warn('An external service has failed to load. Please reload the application when possible');
      }

      var locationController = elm.find('.gmaps-container').controller('ngModel');
      var latController      = elm.find('input.lat').controller('ngModel');
      var lonController      = elm.find('input.lon').controller('ngModel');

      var map = new $window.google.maps.Map(elm.find('.gmaps-container')[0], {
        zoom: 6,
        center: new $window.google.maps.LatLng(51.16, 10.45),
        mapTypeId: $window.google.maps.MapTypeId.ROADMAP
      });

      var marker = new $window.google.maps.Marker({
        map: map,
        position: map.getCenter(),
        draggable: true,
        visible: true
      });

      scope._getMap = function () {
        return map;
      };

      scope.$watch('otEditable', function(otEditable) {
        if (otEditable) {
          marker.setDraggable(true);
        } else {
          marker.setDraggable(false);
        }
      });

      var triggerLocationWatchers = function() {
        if (scope.location && noNumber(scope.location.lat) && noNumber(scope.location.lon)) {
          scope.location = null;
        } else {
          // Dirty Hack to trigger watchers on scope.location to recognize
          // changed locations even though only nested properties were changed
          // The locationController watches location and does not recognize
          // when a property has changed
          scope.location = angular.copy(scope.location);
        }
      };

      var latLngParser = function(latLng) {
        if (latLng) {
          return { lat: latLng.lat(), lon: latLng.lng() };
        } else {
          return null;
        }
      };

      var locationFormatter = function(location) {
        if (location && scope.locationIsValid(location)) {
          return new $window.google.maps.LatLng(location.lat, location.lon);
        } else {
          return null;
        }
      };

      var parse = function (viewValue) {
        if(viewValue === '') return null;
        var val = parseFloat(viewValue);
        return isNaN(val) ? null : val;
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

      latController.$parsers.push(parse);
      lonController.$parsers.push(parse);
      latController.$viewChangeListeners.push(triggerLocationWatchers);
      lonController.$viewChangeListeners.push(triggerLocationWatchers);
      latController.$viewChangeListeners.push(scope.otBindInternalChangeHandler);
      lonController.$viewChangeListeners.push(scope.otBindInternalChangeHandler);

      scope.updateLocation = function(location) {
        scope.location = location;
        scope.otBindInternalChangeHandler();
      };

      scope.removeLocation = function() {
        scope.updateLocation(null);
      };

      $window.google.maps.event.addListener(map, 'click', mapClick);
      $window.google.maps.event.addListener(marker, 'dragend', mapDrag);
      scope.$on('$destroy', function () {
        $window.google.maps.event.clearInstanceListeners(map);
        $window.google.maps.event.clearInstanceListeners(marker);
        map = null;
        marker = null;
      });

      function mapClick(event){
        if (!scope.location && scope.otEditable) {
          marker.setPosition(event.latLng);
          locationController.$setViewValue(event.latLng);
        }
      }

      function mapDrag(event){
        locationController.$setViewValue(event.latLng);
      }

      scope.$watch(function (scope) {
        return {
          lat: scope.location && noNumber(scope.location.lat),
          lon: scope.location && noNumber(scope.location.lon)
        };
      }, function (valid) {
        scope.latAlert = valid.lat ? 'Invalid Value' : null;
        scope.lonAlert = valid.lon ? 'Invalid Value' : null;
      }, true);

      function noNumber(n) {
        return !angular.isNumber(n) || isNaN(n);
      }

      // Search Stuff /////////////////////////////////////////////////////////

      scope.$watch('selectedResult', function (result) {
        if (result) {
          moveMapToSelected();
          defer(scrollToSelected);
        }
      });

      function scrollToSelected() {
        var $selected = elm.find('.selected');
        if ($selected.length === 0) return;
        var $container = elm.find('.search-results');
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
        if(locationController.$viewValue instanceof $window.google.maps.LatLng){
          map.panTo(locationController.$viewValue);
        }
      };

    }
  };
}]);


