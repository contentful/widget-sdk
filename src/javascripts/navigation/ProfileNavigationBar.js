import { routes } from 'core/react-routing';
import React from 'react';
import NavBar from './NavBar/NavBar';
import SidepanelContainer from './Sidepanel/SidepanelContainer';

export default function ProfileNavigationBar() {
  const accessTokensDropdownItems = [
    {
      title: 'Personal access tokens',
      navIcon: 'Token',
      sref: routes['account.cma_tokens']().path,
      srefParams: routes['account.cma_tokens']().params,
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'profile-tokens',
    },
    {
      title: 'OAuth tokens',
      navIcon: 'Token',
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
              navIcon: 'UserProfile',
              sref: 'account.profile.user',
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-settings',
            },
            {
              title: 'Spaces',
              navIcon: 'Spaces',
              sref: routes['account.space_memberships']().path,
              srefParams: routes['account.space_memberships']().params,
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-spaces',
            },
            {
              title: 'Organizations',
              navIcon: 'Organizations',
              sref: routes['account.organization_memberships']().path,
              srefParams: routes['account.organization_memberships']().params,
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-organizations',
            },
            {
              title: 'Tokens',
              navIcon: 'Token',
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-tokens',
              children: accessTokensDropdownItems,
            },
            {
              title: 'OAuth applications',
              navIcon: 'Oauth',
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
