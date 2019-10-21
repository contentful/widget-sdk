import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AccountDropdown from './AccountDropdown.es6';
import { href } from 'states/Navigator.es6';
import * as Authentication from 'Authentication.es6';
// import * as Intercom from 'services/intercom.es6';
import * as Analytics from 'analytics/Analytics.es6';

let wrapper;

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

  it('logs out the user', () => {
    fireEvent.click(wrapper.getByTestId('account-menu-trigger'));
    fireEvent.click(wrapper.getByTestId('nav.account.logout'));

    expect(Analytics.track).toHaveBeenCalledWith('global:logout_clicked');
    expect(Analytics.disable).toHaveBeenCalled();
    expect(Authentication.logout).toHaveBeenCalled();
  });
});
