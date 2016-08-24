'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings
 */
.factory('states/settings', ['$injector', function ($injector) {
  var base = $injector.get('states/base');

  var space = base({
    name: 'space',
    url: '/space',
    label: 'Space settings',
    loadingText: 'Loading space settings...',
    template: '<cf-space-settings class="workbench space-settings" />',
    controller: ['$scope', function ($scope) {
      $scope.context = {};
    }]
  });

  return {
    name: 'settings',
    url: '/settings',
    abstract: true,
    template: '<ui-view/>',
    children: [
      space,
      $injector.get('states/settings/locales'),
      $injector.get('states/settings/users'),
      $injector.get('states/settings/roles'),
      $injector.get('states/settings/webhooks'),
      $injector.get('states/settings/content_preview')
    ]
  };
}]);
