import React from 'react';
import NavBar from './NavBar/NavBar';
import SidepanelContainer from './Sidepanel/SidepanelContainer';

export default function ProfileNavigationBar() {
  const accessTokensDropdownItems = [
    {
      title: 'Personal access tokens',
      navIcon: 'token',
      sref: 'account.profile.cma_tokens',
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'profile-tokens',
    },
    {
      title: 'OAuth tokens',
      navIcon: 'token',
      sref: 'account.profile.access_grants',
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'profile-tokens',
    },
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
              navIcon: 'user-profile',
              sref: 'account.profile.user',
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-settings',
            },
            {
              title: 'Spaces',
              navIcon: 'spaces',
              sref: 'account.profile.space_memberships',
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-spaces',
            },
            {
              title: 'Organizations',
              navIcon: 'organizations',
              sref: 'account.profile.organization_memberships',
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-organizations',
            },
            {
              title: 'Tokens',
              navIcon: 'token',
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-tokens',
              children: accessTokensDropdownItems,
            },
            {
              title: 'OAuth applications',
              navIcon: 'oauth',
              sref: 'account.profile.applications',
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-applications',
            },
          ]}
        />
      </div>
    </>
  );
}