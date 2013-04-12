/*global google:false*/
angular.module('contentful/directives').directive('cfLocationEditor', function(cfSpinner){
  'use strict';

  return {
    restrict: 'C',
    template: JST['cf_location_editor'],
    link: function(scope, elm) {
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
          scope.$apply();
          //TODO handle failure
        });
      };

      scope.$watch('editable', function(editable, old, scope) {
        if (editable) {
          marker.setDraggable(true);
        } else {
          marker.setDraggable(false);
        }
      });

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
          map.panTo(latLng);
        }
      };

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
        if (!scope.location && scope.editable) {
          marker.setPosition(event.latLng);
          locationController.$setViewValue(event.latLng);
        }
      });

      scope.$on('valueChanged', function(event, value){
        scope.location = value;
      });

      google.maps.event.addListener(marker, 'dragend', function(event){
        locationController.$setViewValue(event.latLng);
      });

      // Search Stuff /////////////////////////////////////////////////////////

      scope.$watch('searchTerm', function(searchTerm, old, scope) {
        if (searchTerm && searchTerm != old) {
          var geocoder = new google.maps.Geocoder();
          //var stopSpin = cfSpinner.start();
          geocoder.geocode({
            address: searchTerm
          }, function(results) {
            scope.$apply(function(scope) {
              if (results.length == 1) {
                scope.updateLocation({
                  lat: results[0].geometry.location.lat(),
                  lon: results[0].geometry.location.lng()
                });
                map.fitBounds(results[0].geometry.viewport);
              } else {
                scope.offerResults(results);
              }
            });
            //stopSpin();
          });
        } else {
          scope.results = [];
          scope.selectedResult = 0;
          map.panTo(locationController.$viewValue);
        }
      });

      scope.offerResults = function(rawResults) {
        scope.selectedResult = 0;
        scope.results = _.map(rawResults, function(result) {
          return {
            location: {
              lat: result.geometry.location.lat(),
              lon: result.geometry.location.lng()
            },
            viewport: result.geometry.viewport,
            strippedLocation: {
              lat: result.geometry.location.lat().toString().slice(0,8),
              lon: result.geometry.location.lng().toString().slice(0,8)
            },
            address: result.formatted_address
          };
        });
        scope.movetoSelected();
      };

      elm.find('input[type=search], .results').on('keydown', function(event) {
        var DOWN  = 40,
            UP    = 38,
            ENTER = 13,
            ESC   = 27;

        if (event.keyCode == DOWN){
          scope.selectNext();
          scope.movetoSelected();
          scope.$digest();
          event.preventDefault();
        } else if (event.keyCode == UP) {
          scope.selectPrevious();
          scope.movetoSelected();
          scope.$digest();
          event.preventDefault();
        } else if (event.keyCode == ESC) {
          scope.$apply(function(scope) {
            scope.closePicker();
          });
          event.preventDefault();
        } else if (event.keyCode == ENTER) {
          scope.$apply(function(scope) {
            scope.pickSelected();
          });
          event.preventDefault();
          event.stopPropagation();
        }
      });

      var scrollToSelected = function() {
        var selected = elm.find('.results .selected')[0];
        var $container = elm.find('.results');
        var above = selected.offsetTop <= $container.scrollTop();
        var below = $container.scrollTop() + $container.height()<= selected.offsetTop;
        if (above) {
          selected.scrollIntoView(true);
        } else if (below) {
          selected.scrollIntoView(false);
        }
      };

      scope.movetoSelected = function () {
        var result = scope.results[scope.selectedResult];
        map.fitBounds(result.viewport);
      };

      scope.selectNext = function() {
        if (scope.selectedResult < scope.results.length-1) {
          scope.selectedResult++;
          _.defer(scrollToSelected);
        }
      };

      scope.selectPrevious = function() {
        if (0 < scope.selectedResult) scope.selectedResult--;
        _.defer(scrollToSelected);
      };

      scope.selectResult = function(result) {
        scope.selectedResult = _.indexOf(scope.results, result);
        scope.pickSelected();
      };

      scope.closePicker = function() {
        scope.searchTerm = '';
      };

      scope.pickSelected = function() {
        var result = scope.results[scope.selectedResult];
        if (result) {
          scope.updateLocation(result.location);
          map.fitBounds(result.viewport);
          scope.closePicker();
        }
      };

      // TODO Destroy cleanup

    }
  };
});


