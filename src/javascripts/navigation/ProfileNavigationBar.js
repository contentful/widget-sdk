import React from 'react';
import NavBar from './NavBar/NavBar';
import SidepanelContainer from './Sidepanel/SidepanelContainer';

export default function ProfileNavigationBar() {
  const accessTokensDropdownItems = [
    {
      title: 'Personal access tokens',
      iconPoc: 'token',
      // icon: 'nav-user-oauth',
      sref: 'account.profile.cma_tokens',
      srefOptions: {
        inherit: false
      },
      dataViewType: 'profile-tokens'
    },
    {
      title: 'OAuth tokens',
      iconPoc: 'token',
      // icon: 'nav-user-oauth',
      sref: 'account.profile.access_grants',
      srefOptions: {
        inherit: false
      },
      dataViewType: 'profile-tokens'
    }
  ];

  return (
    <>
      <SidepanelContainer />
      <div className="app-top-bar__outer-wrapper">
        <NavBar
          showQuickNavigation={false}
          showModernStackOnboardingRelaunch={false}
          listItems={[
            {
              title: 'User profile',
              iconPoc: 'user-profile',
              icon: 'nav-user-settings',
              sref: 'account.profile.user',
              srefOptions: {
                inherit: false
              },
              dataViewType: 'profile-settings'
            },
            {
              title: 'Spaces',
              iconPoc: 'spaces',
              icon: 'nav-spaces',
              sref: 'account.profile.space_memberships',
              srefOptions: {
                inherit: false
              },
              dataViewType: 'profile-spaces'
            },
            {
              title: 'Organizations',
              iconPoc: 'organizations',
              icon: 'nav-user-organizations',
              sref: 'account.profile.organization_memberships',
              srefOptions: {
                inherit: false
              },
              dataViewType: 'profile-organizations'
            },
            {
              title: 'Tokens',
              iconPoc: 'token',
              icon: 'nav-user-oauth',
              srefOptions: {
                inherit: false
              },
              dataViewType: 'profile-tokens',
              children: accessTokensDropdownItems
            },
            {
              title: 'OAuth applications',
              iconPoc: 'oauth',
              icon: 'nav-user-applications',
              sref: 'account.profile.applications',
              srefOptions: {
                inherit: false
              },
              dataViewType: 'profile-applications'
            }
          ]}
        />
      </div>
    </>
  );
}
