/*global google:false*/
'use strict';

angular.module('contentful').directive('cfLocationEditor', function(cfSpinner, notification, $parse){
  return {
    restrict: 'C',
    require: 'ngModel',
    template: JST['cf_location_editor'],
    controller: 'cfLocationEditorCtrl',
    link: function(scope, elm, attr, ngModelCtrl) {
      scope.$watch('location && locationValid', function (showMarker) {
        marker.setVisible(showMarker);
      });

      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;

      var locationController = elm.find('.gmaps-container').controller('ngModel');
      var latController = elm.find('input.lat').controller('ngModel');
      var lonController = elm.find('input.lon').controller('ngModel');

      var map = new google.maps.Map(elm.find('.gmaps-container')[0], {
        zoom: 6,
        center: new google.maps.LatLng(51.16, 10.45),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });

      var marker = new google.maps.Marker({
        map: map,
        position: map.getCenter(),
        draggable: true,
        visible: true
      });

      var changeHandler = function() {
        scope.otChangeValue(scope.location, function(err) {
          if (!err) {
            ngModelCtrl.$setViewValue(scope.location);
          } else {
            notification.error('Error updating location');
            scope.location = ngModelCtrl.$modelValue;
          }
        });
      };

      scope.$watch('otEditable', function(otEditable) {
        if (otEditable) {
          marker.setDraggable(true);
        } else {
          marker.setDraggable(false);
        }
      });

      ngModelCtrl.$render = function () {
        scope.location = ngModelCtrl.$viewValue;
      };

      var triggerLocationWatchers = function() {
        // Dirty Hack to trigger watchers on scope.location to recognize
        // changed locations even though only nested properties were changed
        // The locationController watches location and does not recognize
        // when a property has changed
        scope.location = angular.copy(scope.location);
      };

      var latLngParser = function(latLng) {
        if (latLng) {
          return { lat: latLng.lat(), lon: latLng.lng() };
        } else {
          return null;
        }
      };

      var locationFormatter = function(location) {
        if (location) {
          return new google.maps.LatLng(location.lat, location.lon);
        } else {
          return null;
        }
      };

      locationController.$viewChangeListeners.push(changeHandler);
      locationController.$parsers.unshift(latLngParser);
      locationController.$formatters.push(locationFormatter);
      locationController.$render = function() {
        if (!scope.locationValid) return;
        var latLng = locationController.$viewValue;
        if (latLng) {
          marker.setPosition(latLng);
          map.panTo(latLng);
        }
      };

      latController.$parsers.push(parseFloat);
      lonController.$parsers.push(parseFloat);
      latController.$viewChangeListeners.push(triggerLocationWatchers);
      lonController.$viewChangeListeners.push(triggerLocationWatchers);
      latController.$viewChangeListeners.push(changeHandler);
      lonController.$viewChangeListeners.push(changeHandler);

      scope.updateLocation = function(location) {
        scope.location = location;
        changeHandler();
      };

      scope.removeLocation = function() {
        scope.updateLocation(null);
      };

      google.maps.event.addListener(map, 'click', function(event){
        if (!scope.location && scope.otEditable) {
          marker.setPosition(event.latLng);
          locationController.$setViewValue(event.latLng);
        }
      });

      scope.$on('otValueChanged', function(event, path, value){
        //console.log('location editor received valie changed', event, path, value);
        if (path === event.currentScope.otPath) {
          ngModelSet(event.currentScope, value);
        }
      });

      google.maps.event.addListener(marker, 'dragend', function(event){
        locationController.$setViewValue(event.latLng);
      });

      // Search Stuff /////////////////////////////////////////////////////////

      scope.$watch('selectedResult', function (result) {
        if (result) {
          moveMapToSelected();
          _.defer(scrollToSelected);
        }
      });

      function scrollToSelected() {
        var $selected = elm.find('.selected');
        if ($selected.length === 0) return;
        var $container = elm.find('.results');
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
        map.panTo(locationController.$viewValue);
      };

    }
  };
});


