angular.module('contentful')
.directive('cfProfileOldNav', ['require', function (require) {
  return {
    template: require('navigation/templates/ProfileOldNav').default(),
    restrict: 'E',
    scope: {},
    controller: function () {
      var $state = require('$state');
      var controller = this;
      var tabs = [
        {
          name: 'Settings',
          state: { path: ['account', 'profile', 'user'] }
        },
        {
          name: 'Spaces',
          state: { path: ['account', 'profile', 'space_memberships'] }
        },
        {
          name: 'Organizations',
          state: { path: ['account', 'profile', 'organization_memberships'] }
        },
        {
          name: 'Access Tokens',
          state: { path: ['account', 'profile', 'access_grants'] }
        },
        {
          name: 'Applications',
          state: { path: ['account', 'profile', 'applications'] }
        }
      ];

      controller.tabs = tabs.map(function (tab) {
        tab.testId = 'profile-nav-tab-' + tab.name.toLowerCase().replace(/\s+/g, '-');
        tab.selected = $state.current.name === tab.state.path.join('.');
        return tab;
      });

    },
    controllerAs: 'nav'
  };
}]);
