angular.module('contentful')
.directive('cfAccountProfileNav', ['require', function (require) {
  return {
    template: require('account/ProfileNav').default(),
    restrict: 'E',
    scope: {},
    controller: function () {
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

      controller.tabs = tabs.map(function (tab) {
        tab.testId = 'profile-nav-tab-' + tab.name.toLowerCase().replace(/\s+/g, '-');
        tab.selected = $state.current.name === tab.state;
        return tab;
      });

    },
    controllerAs: 'nav'
  };
}]);
