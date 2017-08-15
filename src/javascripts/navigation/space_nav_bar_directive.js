/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for space views.
 */
angular.module('contentful')
.directive('cfSpaceNavBar', ['require', function (require) {
  var navBar = require('navigation/templates/NavBar').default;
  var accessChecker = require('accessChecker');
  var spaceContext = require('spaceContext');

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controllerAs: 'nav',
    controller: ['$scope', function ($scope) {
      // Begin feature flag code - feature-bv-06-2017-use-new-navigation
      var LD = require('utils/LaunchDarkly');
      LD.setOnScope($scope, 'feature-bv-06-2017-use-new-navigation', 'useNewNavigation');
      // End feature flag code - feature-bv-06-2017-use-new-navigation

      this.canNavigateTo = function (section) {
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
        if: 'nav.canNavigateTo("spaceHome")',
        sref: 'spaces.detail.home',
        dataViewType: 'space-home',
        icon: 'nav-home',
        title: 'Space home'
      }, {
        if: 'nav.canNavigateTo("contentType")',
        sref: 'spaces.detail.content_types.list',
        rootSref: 'spaces.detail.content_types',
        dataViewType: 'content-type-list',
        icon: 'nav-ct',
        title: 'Content model'
      }, {
        if: 'nav.canNavigateTo("entry")',
        sref: 'spaces.detail.entries.list',
        rootSref: 'spaces.detail.entries',
        dataViewType: 'entry-list',
        icon: 'nav-entries',
        title: 'Content'
      }, {
        if: 'nav.canNavigateTo("asset")',
        sref: 'spaces.detail.assets.list',
        rootSref: 'spaces.detail.assets',
        dataViewType: 'asset-list',
        icon: 'nav-media',
        title: 'Media'
      }, {
        if: 'nav.canNavigateTo("apiKey")',
        sref: 'spaces.detail.api.home',
        rootSref: 'spaces.detail.api',
        dataViewType: 'api-home',
        icon: 'nav-api',
        title: 'APIs'
      }, {
        if: 'nav.canNavigateTo("settings")',
        dataViewType: 'space-settings',
        rootSref: 'spaces.detail.settings',
        icon: 'nav-settings',
        title: '{{ useNewNavigation ? "Space settings" : "Settings" }}',
        children: [
          {
            sref: 'spaces.detail.settings.space',
            title: '{{ useNewNavigation ? "General" : "Space" }}'
          }, {
            sref: 'spaces.detail.settings.locales.list',
            title: 'Locales',
            rootSref: 'spaces.detail.settings.locales'
          }, {
            sref: 'spaces.detail.settings.users.list',
            title: 'Users',
            rootSref: 'spaces.detail.settings.users'
          }, {
            sref: 'spaces.detail.settings.roles.list',
            title: 'Roles',
            rootSref: 'spaces.detail.settings.roles'
          }, {
            sref: 'spaces.detail.settings.webhooks.list',
            title: 'Webhooks',
            rootSref: 'spaces.detail.settings.webhooks'
          }, {
            sref: 'spaces.detail.settings.content_preview.list',
            title: 'Content preview',
            rootSref: 'spaces.detail.settings.content_preview'
          }
        ]
      }
    ]);
  }
}]);
