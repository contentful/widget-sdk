'use strict';

angular.module('contentful').directive('docsSidebar', ['require', function (require) {
  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');
  var spaceContext = require('spaceContext');

  return {
    template: '<cf-ninja ng-if="showNinja">',
    restrict: 'E',
    controller: ['$scope', function ($scope) {
      var isOrgOwner = function (user) {
        return user === spaceContext.getData('organization.sys.createdBy');
      };

      var ninjaTest$ = LD.getTest('ps-07-2017-ninja-sidebar', isOrgOwner);

      K.onValueScope($scope, ninjaTest$, function (testVal) {
        $scope.showNinja = testVal;
      });
    }]
  };
}]);
