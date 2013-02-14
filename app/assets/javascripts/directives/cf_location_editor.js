/*global google:false*/
angular.module('contentful/directives').directive('cfLocationEditor', function(){
  'use strict';

  return {
    restrict: 'C',
    template: JST['cf_location_editor'],
    link: function(scope, elm) {
      scope.location = null;
      scope.$watch('location', function(loc, old, scope) {
        console.log('location changed', loc, scope);
        marker.setVisible(!!loc);
      });

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
        scope.changeValue(scope.location, function() {
          scope.$apply(function() {
            console.log('changevalue callback');
          });
          //TODO handle failure
        });
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
        var latLng = locationController.$viewValue;
        if (latLng) {
          marker.setPosition(latLng);
          map.setCenter(latLng);
        }
      };
      
      latController.$viewChangeListeners.push(triggerLocationWatchers);
      lonController.$viewChangeListeners.push(triggerLocationWatchers);
      latController.$viewChangeListeners.push(changeHandler);
      lonController.$viewChangeListeners.push(changeHandler);

      scope.removeLocation = function() {
        scope.location = null;
        changeHandler();
      };

      google.maps.event.addListener(map, 'click', function(event){
        if (!scope.location) {
          marker.setPosition(event.latLng);
          locationController.$setViewValue(event.latLng);
        }
      });

      scope.$on('valueChanged', function(event, value){
        console.log('value changed', event, value);
        scope.location = value;
      });

      google.maps.event.addListener(marker, 'dragend', function(event){
        locationController.$setViewValue(event.latLng);
      });
      
    }
  };
});


