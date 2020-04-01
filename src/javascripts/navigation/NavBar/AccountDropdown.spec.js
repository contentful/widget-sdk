import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';

import AccountDropdown from './AccountDropdown';
import { href } from 'states/Navigator';
import { getUser } from 'services/TokenStore';
import { getOpenAssignedTasksAndEntries } from 'app/TasksPage/helpers';
import * as Analytics from 'analytics/Analytics';
import * as Authentication from 'Authentication';

let wrapper;

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
    wrapper = render(<AccountDropdown />);
  });

  it('renders the account dropdown toggle', () => {
    expect(wrapper.getByTestId('account-menu-trigger')).toBeVisible();
  });

  it('navigates to the user profile page', () => {
    fireEvent.click(wrapper.getByTestId('account-menu-trigger'));
    fireEvent.click(wrapper.getByTestId('nav.account.userProfile'));

    expect(href).toHaveBeenCalledWith({
      path: 'account.profile.user',
      options: undefined,
      params: undefined,
    });
  });

  it('logs out the user', async () => {
    fireEvent.click(wrapper.getByTestId('account-menu-trigger'));
    fireEvent.click(wrapper.getByTestId('nav.account.logout').querySelector('button'));

    await wait();

    expect(Analytics.track).toHaveBeenCalledWith('global:logout_clicked');
    expect(Authentication.logout).toHaveBeenCalled();
  });
});
