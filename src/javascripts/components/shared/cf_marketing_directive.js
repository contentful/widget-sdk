'use strict';

angular.module('contentful').directive('cfMarketing', ['$injector', function($injector){
  var environment = $injector.get('environment');
  var $sce = $injector.get('$sce');
  return {
    template: JST.cf_marketing(),
    restrict: 'A',
    transclude: true,
    replace: true,
    scope: true,
    controller: ['$scope', '$attrs', function ($scope, $attrs) {
      $scope.marketingUrl = $sce.trustAsUrl(environment.settings.marketing_url + $attrs.cfMarketing);
    }]
  };
}]);
