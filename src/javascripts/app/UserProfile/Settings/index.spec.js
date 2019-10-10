import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import IndexPage from './index';
import { fetchUserData } from './AccountRepository';

import '@testing-library/jest-dom/extend-expect';

jest.mock('./AccountRepository', () => ({
  fetchUserData: jest.fn()
}));

describe('IndexPage', () => {
  const build = custom => {
    const props = Object.assign(
      {
        title: 'User profile',
        onReady: () => {}
      },
      custom
    );

    return render(<IndexPage {...props} />);
  };

  const createProfile = custom => {
    return Object.assign(
      {
        passwordSet: true,
        userCancellationWarning: {
          singleOwnerOrganizations: []
        },
        identities: []
      },
      custom
    );
  };

  beforeEach(() => {
    const profileData = createProfile();
    fetchUserData.mockResolvedValueOnce(profileData);
  });

  afterEach(cleanup);

  it('should fetch user data when the component renders', async () => {
    build();

    await wait();

    expect(fetchUserData).toHaveBeenCalled();
  });

  it('should render a loading state while the data is loading', async () => {
    const { queryByTestId } = build();

    expect(queryByTestId('cf-ui-loading-state')).toBeVisible();

    await wait();

    expect(queryByTestId('cf-ui-loading-state')).toBeNull();
  });

  it('should call onReady immediately, but only once', async () => {
    const onReady = jest.fn();
    build({ onReady });

    expect(onReady).toHaveBeenCalled();

    await wait();

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('should render an error if the data fails to load', async () => {
    fetchUserData.mockReset().mockRejectedValueOnce(new Error());

    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('cf-ui-error-state')).toBeVisible();
  });

  it('should render the account details and user deletion sections if user is not SSO restricted', async () => {
    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('user-account-data')).toBeVisible();
    expect(queryByTestId('danger-zone-section')).toBeVisible();
  });

  it('should only render account details section if user is SSO restricted', async () => {
    const profile = createProfile({ ssoLoginOnly: true });
    fetchUserData.mockReset().mockResolvedValueOnce(profile);

    const { queryByTestId } = build();

    await wait();

    expect(queryByTestId('user-account-data')).toBeVisible();
    expect(queryByTestId('danger-zone-section')).toBeNull();
  });
});
