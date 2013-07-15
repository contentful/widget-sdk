/*global google:false*/
'use strict';

angular.module('contentful').directive('cfLocationEditor', function(cfSpinner, notification, $parse){
  return {
    restrict: 'C',
    require: 'ngModel',
    template: JST['cf_location_editor'],
    link: function(scope, elm, attr, ngModelCtrl) {
      scope.$watch('location', function(loc, old, scope) {
        //console.log('location changed', loc, scope);
        scope.locationValid = !angular.isObject(loc) || angular.isNumber(loc.lat) && angular.isNumber(loc.lon);
        marker.setVisible(loc && scope.locationValid);
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
          scope.$apply(function (scope) {
            if (!err) {
              ngModelCtrl.$setViewValue(scope.location);
            } else {
              notification.error('Error updating location');
              scope.location = ngModelCtrl.$modelValue;
            }
          });
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
      scope.$watch('searchTerm', function(searchTerm, old, scope) {
        //console.log('search term changed', searchTerm);
        if (searchTerm && searchTerm != old) {
          var geocoder = new google.maps.Geocoder();
          var stopSpin = cfSpinner.start();
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
            stopSpin();
          });
        } else if (searchTerm !== old) {
          scope.results = [];
          scope.selectedResult = null;
          map.panTo(locationController.$viewValue);
        }
      });

      scope.offerResults = function(rawResults) {
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
        scope.selectedResult = scope.results[0];
      };

      scope.$watch('results', function (results) {
        scope.selectedResult = results ? results[0] : null;
      });

      scope.$watch('selectedResult', function (result, old, scope) {
        if (result) {
          scope.moveMapToSelected();
          scrollToSelected();
        }
      });

      scope.$on('searchResultSelected', function (event, index, result) {
        scope.selectedResult = result;
      });

      scope.$on('searchResultPicked', function (event, index, result) {
        scope.selectedResult = result;
        scope.pickResult(result);
      });

      scope.pickResult = function(result) {
        scope.updateLocation(result.location);
        map.fitBounds(result.viewport);
        scope.searchTerm = '';
      };

      function scrollToSelected() {
        var selected = elm.find('.results .selected')[0];
        if(!selected) return;
        var $container = elm.find('.results');
        var above = selected.offsetTop <= $container.scrollTop();
        var below = $container.scrollTop() + $container.height()<= selected.offsetTop;
        if (above) {
          selected.scrollIntoView(true);
        } else if (below) {
          selected.scrollIntoView(false);
        }
      }

      scope.moveMapToSelected = function () {
        var result = scope.selectedResult;
        map.fitBounds(result.viewport);
      };

      // TODO Destroy cleanup

    }
  };
});


