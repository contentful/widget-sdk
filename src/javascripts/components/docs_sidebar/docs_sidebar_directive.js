'use strict';

angular.module('contentful').directive('docsSidebar', ['require', function (require) {
  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');
  var spaceContext = require('spaceContext');
  var analytics = require('analytics/Analytics');

  return {
    template: '<cf-ninja ng-if="showNinja">',
    restrict: 'E',
    controller: ['$scope', function ($scope) {

      var testFlag = 'ps-07-2017-ninja-sidebar';

      var isOrgCreator = function (user) {
        return user === spaceContext.getData('organization.sys.createdBy');
      };

      var ninjaTest$ = LD.getTest(testFlag, isOrgCreator);

      K.onValueScope($scope, ninjaTest$, function (variation) {
        $scope.showNinja = variation;

        analytics.track('experiment:start', {
          experiment: {
            id: 'ps-03-2017-example-space-impact',
            variation: variation
          }
        });
      });
    }]
  };
}]);
