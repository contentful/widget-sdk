'use strict';
angular.module('contentful').controller('FeatureController', ['$scope', '$injector', function FeatureController($scope, $injector){
  var features = $injector.get('features');

  this.shouldAllowAnalytics = features.shouldAllowAnalytics;
}]);
