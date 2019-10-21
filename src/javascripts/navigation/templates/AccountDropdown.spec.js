import React from 'react';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AccountDropdown from './AccountDropdown.es6';
import { href } from 'states/Navigator.es6';
import * as Authentication from 'Authentication.es6';
import { track, disable } from 'analytics/Analytics';
import { getUser } from 'services/TokenStore.es6';
import * as Analytics from 'analytics/Analytics.es6';

let wrapper;

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
  disable: jest.fn()
}));

jest.mock('services/TokenStore.es6', () => ({
  getUser: jest.fn().mockResolvedValue({ sys: {} })
}));

beforeEach(() => {
  wrapper = render(<AccountDropdown />);
  jest.spyOn(Analytics, 'track').mockImplementation(() => {});
  jest.spyOn(Analytics, 'disable').mockImplementation(() => {});
  jest.spyOn(Authentication, 'logout').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

jest.mock('states/Navigator.es6', () => ({
  href: jest.fn()
}));

jest.mock('analytics/Analytics.es6', () => ({
  track: jest.fn(),
  disable: jest.fn()
}));

jest.mock('Authentication.es6', () => ({
  logout: jest.fn()
}));

beforeEach(() => {
  wrapper = render(<AccountDropdown />);
  track.mockClear();
  disable.mockClear();
});

afterEach(() => {
  getUser.mockClear();
  cleanup();
  jest.clearAllMocks();
});

describe('navigation/AccountDropdown.es6', () => {
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
    fireEvent.click(wrapper.getByTestId('nav.account.logout'));

    await wait();

    expect(track).toHaveBeenCalledWith('global:logout_clicked');
    expect(disable).toHaveBeenCalledTimes(1);
    expect(Authentication.logout).toHaveBeenCalled();
  });
});
