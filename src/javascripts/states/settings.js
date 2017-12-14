'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings
 */
.factory('states/settings', ['require', function (require) {
  var base = require('states/Base').default;

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
    children: [
      space,
      require('states/settings/locales'),
      require('states/settings/users'),
      require('states/settings/roles'),
      require('states/settings/webhooks'),
      require('states/settings/content_preview'),
      require('states/settings/Extensions').default,
      require('app/SpaceSettings/Environments/State').default
    ]
  };
}]);
