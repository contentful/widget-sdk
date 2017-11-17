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
  var LD = require('utils/LaunchDarkly');

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controllerAs: 'nav',
    controller: ['$stateParams', '$scope', function ($stateParams, $scope) {
      this.spaceId = $stateParams.spaceId;

      var controller = this;
      LD.onFeatureFlag($scope, 'feature-dv-11-2017-environments', function (environmentsEnabled) {
        controller.environmentsEnabled = environmentsEnabled;
      });

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
        title: 'Space settings',
        children: [
          {
            sref: 'spaces.detail.settings.space',
            dataViewType: 'spaces-settings-space',
            title: 'General'
          }, {
            sref: 'spaces.detail.settings.locales.list',
            dataViewType: 'spaces-settings-locales',
            title: 'Locales',
            rootSref: 'spaces.detail.settings.locales'
          }, {
            sref: 'spaces.detail.settings.users.list',
            dataViewType: 'spaces-settings-users',
            title: 'Users',
            rootSref: 'spaces.detail.settings.users'
          }, {
            sref: 'spaces.detail.settings.roles.list',
            dataViewType: 'spaces-settings-roles',
            title: 'Roles',
            rootSref: 'spaces.detail.settings.roles'
          }, {
            sref: 'spaces.detail.settings.webhooks.list',
            dataViewType: 'spaces-settings-webhooks',
            title: 'Webhooks',
            rootSref: 'spaces.detail.settings.webhooks'
          }, {
            sref: 'spaces.detail.settings.content_preview.list',
            dataViewType: 'spaces-settings-content-preview',
            title: 'Content preview',
            rootSref: 'spaces.detail.settings.content_preview'
          }, {
            sref: 'spaces.detail.settings.extensions',
            title: 'Extensions'
          }, {
            if: 'nav.environmentsEnabled',
            sref: 'spaces.detail.settings.environments',
            title: 'Environments'
          }
        ]
      }
    ]);
  }
}]);
