import React from 'react';
import { render, fireEvent, wait, screen, waitForElement } from '@testing-library/react';

import AccountDropdown from './AccountDropdown';
import { getUser } from 'services/TokenStore';
import { getOpenAssignedTasksAndEntries } from 'app/TasksPage/helpers';
import * as Analytics from 'analytics/Analytics';
import * as Authentication from 'Authentication';
import * as Intercom from 'services/intercom';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
  disable: jest.fn(),
}));

jest.mock('Authentication', () => ({
  logout: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getUser: jest.fn().mockResolvedValue({
    firstName: 'Dolly',
    lastName: 'Parton',
    avatarUrl: 'https://geocities.com/avatars/dolly-parton.jpg',
    email: 'dolly.parton@dollywood.com',
    sys: { id: 'foo' },
  }),
}));

jest.mock('states/Navigator', () => ({
  href: jest.fn(),
}));

jest.mock('app/TasksPage/helpers', () => ({
  getOpenAssignedTasksAndEntries: jest.fn(),
}));

describe('AccountDropdown', () => {
  beforeEach(() => {
    getOpenAssignedTasksAndEntries.mockResolvedValue([[], []]);
    Analytics.track.mockClear();
    Authentication.logout.mockClear();
    getUser.mockClear();

    Intercom.isEnabled.mockClear().mockReturnValue(false);
  });

  it('renders the account dropdown toggle', async () => {
    await build();

    expect(screen.getByTestId('account-menu-trigger')).toBeVisible();
  });

  it('logs out the user', async () => {
    await build();

    fireEvent.click(screen.getByTestId('account-menu-trigger'));
    fireEvent.click(screen.getByTestId('nav.account.logout').querySelector('button'));

    await wait();

    expect(Analytics.track).toHaveBeenCalledWith('global:logout_clicked');
    expect(Authentication.logout).toHaveBeenCalled();
  });

  it('should show the `Talk to us` button if Intercom is enabled', async () => {
    Intercom.isEnabled.mockClear().mockReturnValue(true);

    await build();

    fireEvent.click(screen.getByTestId('account-menu-trigger'));

    expect(screen.getByTestId('nav.account.intercom')).toBeVisible();
  });

  it('should not show the `Talk to us` button if Intercom is not enabled', async () => {
    await build();

    fireEvent.click(screen.getByTestId('account-menu-trigger'));

    // By default, Intercom is not enabled
    expect(screen.queryByTestId('nav.account.intercom')).toBeNull();
  });
});

async function build() {
  render(
    <SpaceEnvContextProvider>
      <AccountDropdown />
    </SpaceEnvContextProvider>
  );

  await waitForElement(() => screen.getByTestId('account-menu'));
}
