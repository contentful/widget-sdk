'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/space_home
 */
.factory('states/space_home', ['require', function (require) {
  var base = require('states/base');
  var accessChecker = require('accessChecker');
  var template = require('app/home/HomeTemplate').default;
  var spaceContext = require('spaceContext');
  var LD = require('utils/LaunchDarkly');
  var K = require('utils/kefir');

  return base({
    name: 'home',
    url: '/home',
    label: 'Space home',
    template: template(),
    loadingText: 'Loading...',
    controller: ['$scope', function ($scope) {
      $scope.context = {ready: true};
      $scope.context.forbidden = !accessChecker.getSectionVisibility().spaceHome;

      // Start A/B test
      var isOrgOwner = function (user) {
        return user === spaceContext.getData('organization.sys.createdBy');
      };

      var ninjaTest$ = LD.getTest('ps-07-2017-ninja-sidebar', isOrgOwner);

      K.onValueScope($scope, ninjaTest$, function (testVal) {
        $scope.showNinja = testVal;
      });
      // End A/B test
    }]
  });
}]);
