angular.module('contentful')
.directive('cfProfileNav', ['require', function (require) {
  var navBar = require('ui/NavBar').default;

  return {
    template: template(),
    restrict: 'E',
    controller: ['$scope', function ($scope) {
      // Required by navbar to highlight the active tab
      $scope.$state = require('$state');
    }]
  };

  function template () {
    return navBar([
      {
        title: 'Settings',
        icon: 'nav-user-settings',
        sref: 'account.profile.user',
        dataViewType: 'profile-settings'
      }, {
        title: 'Spaces',
        icon: 'nav-spaces',
        sref: 'account.profile.space_memberships',
        dataViewType: 'profile-spaces'
      }, {
        title: 'Organizations',
        icon: 'nav-user-organizations',
        sref: 'account.profile.organization_memberships',
        dataViewType: 'profile-organizations'
      }, {
        title: 'Access Tokens',
        icon: 'nav-user-oauth',
        sref: 'account.profile.access_grants',
        dataViewType: 'profile-tokens'
      }, {
        title: 'Applications',
        icon: 'nav-user-applications',
        sref: 'account.profile.applications',
        dataViewType: 'profile-applications'
      }
    ]);
  }
}]);
