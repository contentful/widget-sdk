import React from 'react';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AccountDropdown from './AccountDropdown.es6';
import { href } from 'states/Navigator.es6';
import { getUser } from 'services/TokenStore.es6';
import { getOpenAssignedTasksAndEntries } from 'app/TasksPage/helpers.es6';
import * as Analytics from 'analytics/Analytics';
import * as Authentication from 'Authentication.es6';

let wrapper;

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
  disable: jest.fn()
}));

jest.mock('Authentication.es6', () => ({
  logout: jest.fn()
}));

jest.mock('services/TokenStore.es6', () => ({
  getUser: jest.fn().mockResolvedValue({
    firstName: 'Dolly',
    lastName: 'Parton',
    avatarUrl: 'https://geocities.com/avatars/dolly-parton.jpg',
    email: 'dolly.parton@dollywood.com',
    sys: { id: 'foo' }
  })
}));

jest.mock('states/Navigator.es6', () => ({
  href: jest.fn()
}));

jest.mock('app/TasksPage/helpers.es6', () => ({
  getOpenAssignedTasksAndEntries: jest.fn()
}));

beforeEach(() => {
  wrapper = render(<AccountDropdown />);
  getOpenAssignedTasksAndEntries.mockResolvedValue([[], []]);
  Analytics.track.mockClear();
  Analytics.disable.mockClear();
  Authentication.logout.mockClear();
  getUser.mockClear();
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('AccountDropdown', () => {
  beforeEach(() => {
    wrapper = render(<AccountDropdown />);
  });

  it('renders the account dropdown toggle', () => {
    expect(wrapper.getByTestId('account-menu-trigger')).toBeVisible();
  });

  it('navigates to the user profile page', () => {
    fireEvent.click(wrapper.getByTestId('account-menu-trigger'));
    fireEvent.click(wrapper.getByTestId('nav.account.userProfile'));

    expect(href).toHaveBeenCalledWith({
      path: ['account', 'profile', 'user']
    });
  });

  it('logs out the user', async () => {
    fireEvent.click(wrapper.getByTestId('account-menu-trigger'));
    fireEvent.click(wrapper.queryByTestId('nav.account.logout'));

    await wait();

    expect(Analytics.track).toHaveBeenCalledWith('global:logout_clicked');
    expect(Analytics.disable).toHaveBeenCalledTimes(1);
    expect(Authentication.logout).toHaveBeenCalled();
  });
});
