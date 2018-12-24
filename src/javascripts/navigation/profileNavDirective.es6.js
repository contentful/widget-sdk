import { registerDirective } from 'NgRegistry.es6';
import navBar from 'navigation/templates/NavBar.es6';

/**
 * @ngdoc directive
 * @name cfProfileNavBar
 * @description
 * Displays the top navigation bar for user profile views.
 */
registerDirective('cfProfileNav', () => {
  return {
    template: template(),
    restrict: 'E',
    scope: {}
  };

  function template() {
    return navBar([
      {
        title: 'Settings',
        icon: 'nav-user-settings',
        sref: 'account.profile.user',
        inheritUrlParams: false,
        dataViewType: 'profile-settings'
      },
      {
        title: 'Spaces',
        icon: 'nav-spaces',
        sref: 'account.profile.space_memberships',
        inheritUrlParams: false,
        dataViewType: 'profile-spaces'
      },
      {
        title: 'Organizations',
        icon: 'nav-user-organizations',
        sref: 'account.profile.organization_memberships',
        inheritUrlParams: false,
        dataViewType: 'profile-organizations'
      },
      {
        title: 'OAuth Tokens',
        icon: 'nav-user-oauth',
        sref: 'account.profile.access_grants',
        inheritUrlParams: false,
        dataViewType: 'profile-tokens'
      },
      {
        title: 'Applications',
        icon: 'nav-user-applications',
        sref: 'account.profile.applications',
        inheritUrlParams: false,
        dataViewType: 'profile-applications'
      }
    ]);
  }
});
