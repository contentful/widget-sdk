'use strict';

angular.module('contentful').directive('cfLocationEditor', function(){
  return {
    restrict: 'C',
    require: 'ngModel',
    template: JST['cf_location_editor'],
    controller: 'cfLocationEditorController',
    link: function(scope, elm) {
      var latController      = elm.find('input.lat').controller('ngModel');
      var lonController      = elm.find('input.lon').controller('ngModel');

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

      var parse = function (viewValue) {
        if(viewValue === '') return null;
        var val = parseFloat(viewValue);
        return isNaN(val) ? null : val;
      };

      latController.$parsers.push(parse);
      lonController.$parsers.push(parse);
      latController.$viewChangeListeners.push(triggerLocationWatchers);
      lonController.$viewChangeListeners.push(triggerLocationWatchers);
      latController.$viewChangeListeners.push(scope.otBindInternalChangeHandler);
      lonController.$viewChangeListeners.push(scope.otBindInternalChangeHandler);

      scope.$watch(function (scope) {
        return {
          lat: scope.location && noNumber(scope.location.lat),
          lon: scope.location && noNumber(scope.location.lon)
        };
      }, function (valid) {
        scope.latAlert = valid.lat ? 'Invalid Value' : null;
        scope.lonAlert = valid.lon ? 'Invalid Value' : null;
      }, true);

      scope.removeLocation = function() {
        scope.updateLocation(null);
      };

      scope.updateLocation = function(location) {
        scope.location = location;
        scope.otBindInternalChangeHandler();
      };

      function noNumber(n) {
        return !angular.isNumber(n) || isNaN(n);
      }
    }
  };
});


