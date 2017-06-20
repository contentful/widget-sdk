import navBar from 'ui/NavBar';

export default function () {
  return navBar([
    {
      title: 'Settings',
      sref: 'account.profile.user',
      dataViewType: 'profile-settings'
    }, {
      title: 'Spaces',
      sref: 'account.profile.space_memberships',
      dataViewType: 'profile-spaces'
    }, {
      title: 'Organizations',
      sref: 'account.profile.organization_memberships',
      dataViewType: 'profile-organizations'
    }, {
      title: 'Access Tokens',
      sref: 'account.profile.access_grants',
      dataViewType: 'profile-tokens'
    }, {
      title: 'Applications',
      sref: 'account.profile.applications',
      dataViewType: 'profile-applications'
    }
  ]);
}
