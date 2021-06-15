import { routes } from 'core/react-routing';
import React from 'react';
import NavBar from './NavBar/NavBar';
import { SidepanelContainer } from './Sidepanel/SidepanelContainer';
import { StateTitle } from './Sidepanel/SidePanelTrigger/SidePanelTrigger';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const store = getBrowserStorage();

export function ProfileNavigationBar() {
  const user = routes['account.profile.user']();
  const cmaTokens = routes['account.profile.cma_tokens']();
  const oauthTokens = routes['account.profile.oauth_tokens']();
  const oauthApplications = routes['account.profile.oauth_application']();
  const spaceMembership = routes['account.profile.space_memberships']();
  const orgMembership = routes['account.profile.organization_memberships']();

  const accessTokensDropdownItems = [
    {
      title: 'Personal access tokens',
      navIcon: 'Token',
      sref: cmaTokens.path,
      srefParams: cmaTokens.params,
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'profile-tokens',
    },
    {
      title: 'OAuth tokens',
      navIcon: 'Token',
      sref: oauthTokens.path,
      srefParams: oauthTokens.params,
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'profile-tokens',
    },
  ];

  const lastUsedOrgId = store.get('lastUsedOrg');

  return (
    <div className="app-top-bar">
      <SidepanelContainer
        triggerText={<StateTitle title="Account settings" />}
        currentOrgId={lastUsedOrgId}
      />
      <div className="app-top-bar__outer-wrapper">
        <NavBar
          listItems={[
            {
              title: 'User profile',
              navIcon: 'UserProfile',
              sref: user.path,
              srefParams: user.params,
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-settings',
            },
            {
              title: 'Spaces',
              navIcon: 'Spaces',
              sref: spaceMembership.path,
              srefParams: spaceMembership.params,
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-spaces',
            },
            {
              title: 'Organizations',
              navIcon: 'Organizations',
              sref: orgMembership.path,
              srefParams: orgMembership.params,
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
              sref: oauthApplications.path,
              srefParams: oauthApplications.params,
              srefOptions: {
                inherit: false,
              },
              dataViewType: 'profile-applications',
            },
          ]}
        />
      </div>
    </div>
  );
}
