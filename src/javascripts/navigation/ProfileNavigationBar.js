import React from 'react';
import NavBar from './NavBar/NavBar';

export default function ProfileNavigationBar() {
  return (
    <NavBar
      showQuickNavigation={false}
      showModernStackOnboardingRelaunch={false}
      listItems={[
        {
          title: 'Settings',
          icon: 'nav-user-settings',
          sref: 'account.profile.user',
          srefOptions: {
            inherit: false
          },
          dataViewType: 'profile-settings'
        },
        {
          title: 'Spaces',
          icon: 'nav-spaces',
          sref: 'account.profile.space_memberships',
          srefOptions: {
            inherit: false
          },
          dataViewType: 'profile-spaces'
        },
        {
          title: 'Organizations',
          icon: 'nav-user-organizations',
          sref: 'account.profile.organization_memberships',
          srefOptions: {
            inherit: false
          },
          dataViewType: 'profile-organizations'
        },
        {
          title: 'OAuth Tokens',
          icon: 'nav-user-oauth',
          sref: 'account.profile.access_grants',
          srefOptions: {
            inherit: false
          },
          dataViewType: 'profile-tokens'
        },
        {
          title: 'Applications',
          icon: 'nav-user-applications',
          sref: 'account.profile.applications',
          srefOptions: {
            inherit: false
          },
          dataViewType: 'profile-applications'
        }
      ]}
    />
  );
}
