/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for space views.
 */
angular.module('contentful')
.directive('cfSpaceNavBar', ['require', function (require) {
  var navBar = require('app/NavBar').default;
  var accessChecker = require('accessChecker');
  var spaceContext = require('spaceContext');

  return {
    template: template(),
    restrict: 'E',
    replace: true,
    controller: ['$scope', function ($scope) {
      // Required by navbar to highlight the active tab
      $scope.$state = require('$state');
      $scope.canNavigateTo = function (section) {
        if (!spaceContext.space || spaceContext.space.isHibernated()) {
          return false;
        } else {
          return accessChecker.getSectionVisibility()[section];
        }
      };
    }]
  };

  function template () {
    return navBar([
      {
        if: 'canNavigateTo("spaceHome")',
        sref: 'spaces.detail.home',
        dataViewType: 'space-home',
        icon: 'nav-home',
        title: 'Space home'
      }, {
        if: 'canNavigateTo("contentType")',
        sref: 'spaces.detail.content_types',
        dataViewType: 'content-type-list',
        icon: 'nav-ct',
        title: 'Content model'
      }, {
        if: 'canNavigateTo("entry")',
        sref: 'spaces.detail.entries',
        dataViewType: 'entry-list',
        icon: 'nav-entries',
        title: 'Content'
      }, {
        if: 'canNavigateTo("asset")',
        sref: 'spaces.detail.assets',
        dataViewType: 'asset-list',
        icon: 'nav-media',
        title: 'Media'
      }, {
        if: 'canNavigateTo("apiKey")',
        sref: 'spaces.detail.api',
        dataViewType: 'api-home',
        icon: 'nav-api',
        title: 'APIs'
      }, {
        if: 'canNavigateTo("settings")',
        dataViewType: 'space-settings',
        rootSref: 'spaces.detail.settings',
        icon: 'nav-settings',
        title: 'Settings',
        children: [
          {
            sref: 'spaces.detail.settings.space',
            title: 'Space'
          }, {
            sref: 'spaces.detail.settings.locales',
            title: 'Locales'
          }, {
            sref: 'spaces.detail.settings.users',
            title: 'Users'
          }, {
            sref: 'spaces.detail.settings.roles',
            title: 'Roles'
          }, {
            sref: 'spaces.detail.settings.webhooks',
            title: 'Webhooks'
          }, {
            sref: 'spaces.detail.settings.content_preview',
            title: 'Content preview'
          }
        ]
      }
    ]);
  }
}]);
