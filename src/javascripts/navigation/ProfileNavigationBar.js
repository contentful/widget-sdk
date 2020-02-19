import React from 'react';
import NavBar from './NavBar/NavBar';
import SidepanelContainer from './Sidepanel/SidepanelContainer';

export default function ProfileNavigationBar() {
  const accessTokensDropdownItems = [
    {
      title: 'Personal access tokens',
      icon: 'nav-user-oauth',
      sref: 'account.profile.cma_tokens',
      srefOptions: {
        inherit: false
      },
      dataViewType: 'profile-tokens'
    },
    {
      title: 'OAuth tokens',
      icon: 'nav-user-oauth',
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
              title: 'Tokens',
              icon: 'nav-user-oauth',
              srefOptions: {
                inherit: false
              },
              dataViewType: 'profile-tokens',
              children: accessTokensDropdownItems
            },
            {
              title: 'OAuth applications',
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
