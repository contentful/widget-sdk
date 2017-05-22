angular.module('contentful')
.directive('cfAccountProfileNav', function () {
  return {
    template: JST['profile_nav'](),
    restrict: 'E',
    scope: {},
    controller: ['require', function (require) {
      var $state = require('$state');
      var controller = this;
      var tabs = [
        {
          name: 'Settings',
          state: 'account.profile.user'
        },
        {
          name: 'Spaces',
          state: 'account.profile.space_memberships'
        },
        {
          name: 'Organizations',
          state: 'account.profile.organization_memberships'
        },
        {
          name: 'Access Tokens',
          state: 'account.profile.access_grants'
        },
        {
          name: 'Applications',
          state: 'account.profile.applications'
        }
      ];

      controller.stateName = $state.current.name;

      controller.tabs = _.map(tabs, function (tab) {
        tab.id = 'profile-nav-tab-' + tab.name.toLowerCase().replace(/\s+/g, '-');
        tab.selected = controller.stateName === tab.state;
        return tab;
      });

    }],
    controllerAs: 'nav'
  };
});
