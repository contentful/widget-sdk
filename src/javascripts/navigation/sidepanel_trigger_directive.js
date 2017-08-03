'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 */
.directive('cfNavSidepanelTrigger', ['require', function (require) {
  var spaceContext = require('spaceContext');
  var tokenStore = require('services/TokenStore');
  var $state = require('$state');
  var $rootScope = require('$rootScope');
  var SumTypes = require('libs/sum-types');
  var caseof = SumTypes.caseofEq;
  var otherwise = SumTypes.otherwise;
  var template = require('navigation/SidepanelTrigger.template').default();

  return {
    restrict: 'E',
    template: template,
    scope: {
      triggerClick: '&'
    },
    replace: true,
    controller: ['$scope', function ($scope) {

      $rootScope.$on('$stateChangeSuccess', function () {
        if ($state.current.name === 'account.organizations.new') {
          setState('NewOrg');
        } else if ($state.current.name.startsWith('account.profile')) {
          setState('UserProfile');
        } else if ($state.current.name.startsWith('account.organizations') && $state.params.orgId) {
          tokenStore.getOrganization($state.params.orgId).then(function (org) {
            setState('OrgSettings', { org: org });
          });
        } else if (!spaceContext.space) {
          setState('Default');
        }
      });

      // TODO add kefir properties and use K.onValueScope
      $scope.$watchCollection(function () {
        return {
          space: _.get(spaceContext, 'space.data'),
          org: _.get(spaceContext, 'organizationContext.organization')
        };
      }, function (values) {
        if (values.space && values.org) {
          setState('Space', values);
        }
      });

      function setState (state, params) {
        caseof(state, [
          ['Space', function () {
            $scope.title = params.space.name;
            $scope.subtitle = 'in ' + params.org.name;
          }],
          ['OrgSettings', function () {
            $scope.title = 'Organization Settings';
            $scope.subtitle = 'in ' + params.org.name;
          }],
          ['NewOrg', function () {
            $scope.title = 'Create new organization';
            $scope.subtitle = undefined;
          }],
          ['UserProfile', function () {
            $scope.title = 'User Profile';
            $scope.subtitle = undefined;
          }],
          [otherwise, function () {
            $scope.title = 'Welcome to Contentful';
            $scope.subtitle = undefined;
          }]
        ]);
      }
    }]
  };
}]);
