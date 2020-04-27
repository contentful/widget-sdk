import React from 'react';
import { render, wait, screen } from '@testing-library/react';
import IndexPage from '.';
import { fetchUserData } from './AccountRepository';

jest.mock('./AccountRepository', () => ({
  fetchUserData: jest.fn(),
}));

describe('IndexPage', () => {
  const build = (custom) => {
    const props = Object.assign(
      {
        title: 'User profile',
      },
      custom
    );

    return render(<IndexPage {...props} />);
  };

  const createProfile = (custom) => {
    return Object.assign(
      {
        passwordSet: true,
        userCancellationWarning: {
          singleOwnerOrganizations: [],
        },
        identities: [],
      },
      custom
    );
  };

  beforeEach(() => {
    const profileData = createProfile();
    fetchUserData.mockResolvedValueOnce(profileData);
  });

  it('should fetch user data when the component renders', async () => {
    build();

    await wait();

    expect(fetchUserData).toHaveBeenCalled();
  });

  it('should render a loading state while the data is loading', async () => {
    build();

    expect(screen.queryByTestId('cf-ui-loading-state')).toBeVisible();

    await wait();

    expect(screen.queryByTestId('cf-ui-loading-state')).toBeNull();
  });

  it('should render an error if the data fails to load', async () => {
    fetchUserData.mockReset().mockRejectedValueOnce(new Error());

    build();

    await wait();

    expect(screen.queryByTestId('cf-ui-error-state')).toBeVisible();
  });

  it('should render the account details and user deletion sections if user is not SSO restricted', async () => {
    build();

    await wait();

    expect(screen.queryByTestId('account-details-section-card')).toBeVisible();
    expect(screen.queryByTestId('danger-zone-section-card')).toBeVisible();
  });

  it('should only render account details section if user is SSO restricted', async () => {
    const profile = createProfile({ ssoLoginOnly: true });
    fetchUserData.mockReset().mockResolvedValueOnce(profile);

    build();

    await wait();

    expect(screen.queryByTestId('account-details-section-card')).toBeVisible();
    expect(screen.queryByTestId('danger-zone-section-card')).toBeNull();
  });

  describe('Security section', () => {
    it('should show the security section if the user is not SSO restricted', async () => {
      build();

      await wait();

      expect(screen.queryByTestId('security-section-card')).toBeVisible();
    });

    it('should not show the security section if the user is SSO restricted', async () => {
      const profile = createProfile({ ssoLoginOnly: true });
      fetchUserData.mockReset().mockResolvedValueOnce(profile);

      build();

      await wait();

      expect(screen.queryByTestId('security-section-card')).toBeNull();
    });
  });

  describe('Privacy section', () => {
    it('should show the cookie consent section always, even when the user is SSO restricted', async () => {
      build();

      await wait();

      expect(screen.getByTestId('privacy-section-card')).toBeVisible();

      const profile = createProfile({ ssoLoginOnly: true });
      fetchUserData.mockReset().mockResolvedValueOnce(profile);

      expect(screen.getByTestId('privacy-section-card')).toBeVisible();
    });
  });
});
