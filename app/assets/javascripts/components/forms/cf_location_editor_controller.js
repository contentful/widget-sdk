/*global google*/
'use strict';

angular.module('contentful').controller('cfLocationEditorCtrl', function ($scope, cfSpinner) {

  $scope.$watch('location', function(loc, old, scope) {
    //console.log('location changed', loc);
    scope.locationValid = scope.locationIsValid(loc);
    //console.log('setting valid to', scope.locationValid);
  });

  $scope.locationIsValid = function (loc) {
    return !angular.isObject(loc) || isNumber(loc.lat) && isNumber(loc.lon);
  };

  function isNumber(n) {
    return angular.isNumber(n) && !isNaN(n);
  }


  $scope.$watch('searchTerm', function(searchTerm, old, scope) {
    if (searchTerm && searchTerm != old) { //changed Searchterm
      //console.log('search term changed', searchTerm);
      var geocoder = new google.maps.Geocoder();
      var stopSpin = cfSpinner.start();
      geocoder.geocode({
        address: searchTerm
      }, function(results) {
        scope.$apply(function(scope) {
          scope.results = convertResults(results);
          stopSpin();
        });
      });
    } else if (searchTerm !== old) { //removed Searchterm
      //console.log('search term cleared', searchTerm);
      scope.results = [];
      scope.selectedResult = null;
      scope.resetMapLocation();
    }
  });

  function convertResults(rawResults) {
    return _.map(rawResults, function(result) {
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
  }

  $scope.$watch('results', function (results, old, scope) {
    scope.selectedResult = results && results[0] ? results[0] : null;
  });

  $scope.$on('autocompleteResultSelected', function (event, index, result) {
    event.currentScope.selectedResult = result;
  });

  $scope.$on('autocompleteResultPicked', function (event, index, result) {
    var scope = event.currentScope;
    scope.selectedResult = result;
    scope.pickResult(result);
  });


  // TODO Destroy cleanup

  
});
