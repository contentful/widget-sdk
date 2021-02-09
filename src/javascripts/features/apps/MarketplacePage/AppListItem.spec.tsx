import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MarketplaceApp } from 'features/apps-core';
import { AppListItem } from './AppListItem';
import { AppManager } from '../AppOperations';
import { hasConfigLocation } from '../utils';
import { Notification } from '@contentful/forma-36-react-components';
import { go as navigateToConfig } from 'states/Navigator';

jest.mock('services/TokenStore', () => ({
  getDomains: () => ({
    images: '',
  }),
}));

jest.mock('@contentful/forma-36-react-components', () => ({
  ...(jest.requireActual('@contentful/forma-36-react-components') as any),
  Notification: { error: jest.fn() },
}));

jest.mock('states/Navigator');

jest.mock('../utils');

const appManager = {} as AppManager;
const props = {
  app: ({
    id: 'optimizely',
    title: 'Optimizely',
    appDefinition: {
      name: 'optimizely',
      sys: {
        id: 'optimizely-app-id',
      },
    },
    icon:
      '//images.ctfassets.net/lpjm8d10rkpy/4X7O4Q0pIgQZNcONoQrQlp/9262ad9a935fa92e9cacd9207ae0a401/optimizely-logo.svg',
    categories: ['Featured', 'Personalization'],
  } as unknown) as MarketplaceApp,
  appManager,
  openDetailModal: jest.fn(),
  orgId: 'an-org',
  hasAdvancedAppsFeature: true,
};

const actions = ['About', 'Install', 'Uninstall', 'Configure', 'Edit app definition'];

const testItem = ({
  name,
  canManageApps = true,
  isInstalled = false,
  isPrivate = false,
  hasConfig = true,
  expectedDropdownActions = [],
  callback,
}: {
  name: string;
  canManageApps?: boolean;
  isPrivate?: boolean;
  isInstalled?: boolean;
  hasConfig?: boolean;
  callback?: Function;
  expectedDropdownActions?: string[];
}) => {
  it('should have correct actions for ' + name, async () => {
    (hasConfigLocation as jest.Mock).mockReturnValueOnce(hasConfig);
    render(
      <AppListItem
        {...props}
        app={{ ...props.app, isPrivateApp: isPrivate, appInstallation: isInstalled as any }}
        canManageApps={canManageApps}
      />
    );

    // Open the dropdown menu
    if (canManageApps) {
      fireEvent.click(screen.getByText('Actions'));
    } else {
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    }

    // Check that the intended actions are there
    for (const action of expectedDropdownActions) {
      expect(screen.getByText(action)).toBeTruthy();
    }
    // Check that other available actions are NOT in the dropdown
    for (const action of actions) {
      if (!expectedDropdownActions.includes(action)) {
        expect(screen.queryByText(action)).not.toBeInTheDocument();
      }
    }

    // Check click on the main Tile
    fireEvent.click(screen.getByText('Optimizely'));
    if (callback) {
      expect(callback).toHaveBeenCalled();
    } else {
      expect(props.openDetailModal).not.toHaveBeenCalled();
    }
  });
};

describe('AppListItem', () => {
  describe('when user can not manage app', () => {
    testItem({
      name: 'public apps',
      canManageApps: false,
      callback: props.openDetailModal,
      expectedDropdownActions: ['About'],
    });
    testItem({
      name: 'private apps',
      canManageApps: false,
      isPrivate: true,
      callback: Notification.error,
    });
  });
  describe('when user can manage app', () => {
    testItem({
      name: 'public apps',
      callback: props.openDetailModal,
      expectedDropdownActions: ['About', 'Install'],
    });
    testItem({
      name: 'private apps',
      isPrivate: true,
      // The modal jumps directly to permissions here
      callback: props.openDetailModal,
      expectedDropdownActions: ['Install', 'Edit app definition'],
    });
    testItem({
      name: 'configless public apps',
      hasConfig: false,
      callback: props.openDetailModal,
      expectedDropdownActions: ['About', 'Install'],
    });
    testItem({
      name: 'configless private apps',
      isPrivate: true,
      hasConfig: false,
      // The modal jumps directly to permissions here
      callback: props.openDetailModal,
      expectedDropdownActions: ['Install', 'Edit app definition'],
    });
    testItem({
      name: 'installed public apps',
      isInstalled: true,
      callback: navigateToConfig,
      expectedDropdownActions: ['About', 'Uninstall', 'Configure'],
    });
    testItem({
      name: 'installed private apps',
      isInstalled: true,
      isPrivate: true,
      callback: navigateToConfig,
      expectedDropdownActions: ['Uninstall', 'Configure', 'Edit app definition'],
    });
    testItem({
      name: 'installed configless public apps',
      isInstalled: true,
      hasConfig: false,
      callback: props.openDetailModal,
      expectedDropdownActions: ['About', 'Uninstall'],
    });
    testItem({
      name: 'installed configless private apps',
      isInstalled: true,
      isPrivate: true,
      hasConfig: false,
      expectedDropdownActions: ['Uninstall', 'Edit app definition'],
    });
  });
});
