import React from 'react';
import NavBar from './NavBar/NavBar';
import { SidepanelContainer } from './Sidepanel/SidepanelContainer';
import { StateTitle } from './Sidepanel/SidePanelTrigger/SidePanelTrigger';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { ReactRouterNavigationSubitemType } from './NavBar/ReactRouterNavigationItem';

const store = getBrowserStorage();

export function ProfileNavigationBar() {
  const accessTokensDropdownItems = [
    {
      title: 'Personal access tokens',
      navIcon: 'Token',
      route: { path: 'account.profile.cma_tokens' },
      dataViewType: 'profile-tokens',
    },
    {
      title: 'OAuth tokens',
      navIcon: 'Token',
      route: { path: 'account.profile.oauth_tokens' },
      dataViewType: 'profile-tokens',
    },
  ] as ReactRouterNavigationSubitemType[];

  const lastUsedOrgId = store.get('lastUsedOrg');

  return (
    <div className="app-top-bar">
      <SidepanelContainer
        triggerText={<StateTitle title="Account settings" />}
        currentOrgId={lastUsedOrgId}
      />
      <div className="app-top-bar__outer-wrapper">
        <NavBar
          reactRouterListItems={[
            {
              title: 'User profile',
              navIcon: 'UserProfile',
              route: { path: 'account.profile.user' },
              dataViewType: 'profile-settings',
            },
            {
              title: 'Spaces',
              navIcon: 'Spaces',
              route: { path: 'account.profile.space_memberships' },
              dataViewType: 'profile-spaces',
            },
            {
              title: 'Organizations',
              navIcon: 'Organizations',
              route: { path: 'account.profile.organization_memberships' },
              dataViewType: 'profile-organizations',
            },
            {
              title: 'Tokens',
              navIcon: 'Token',
              dataViewType: 'profile-tokens',
              children: accessTokensDropdownItems,
              isActiveFn: (pathname) => {
                return (
                  pathname.startsWith('/account/profile/cma_tokens') ||
                  pathname.startsWith('/account/profile/access_grants')
                );
              },
              route: { path: 'account.profile.cma_tokens' },
            },
            {
              title: 'OAuth applications',
              navIcon: 'Oauth',
              route: {
                path: 'account.profile.oauth_application',
              },
              dataViewType: 'profile-applications',
            },
          ]}
        />
      </div>
    </div>
  );
}
