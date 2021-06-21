import React from 'react';
import { when } from 'jest-when';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';
import * as TokenStore from 'services/TokenStore';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { go } from 'states/Navigator';
import { router } from 'core/react-routing';
import { setUser } from 'services/OrganizationRoles';
import * as CreateSpace from 'services/CreateSpace';

import { EmptyHome } from './EmptyHome';

// with spaces
const mockOrgWithSpace1 = Fake.Organization();
const mockOrgWithSpace2 = Fake.Organization();

// with only membership
const mockOrgNoSpaces1 = Fake.Organization();
const mockOrgNoSpaces2 = Fake.Organization();

// with no space or membership
const mockOtherOrg = Fake.Organization();

const mockSpace1 = Fake.Space({
  organization: mockOrgWithSpace1,
});
const mockSpace2 = Fake.Space({
  organization: mockOrgWithSpace2,
});
const mockSpace3 = Fake.Space({
  organization: mockOrgWithSpace1,
});

const mockUser = Fake.User({
  organizationMemberships: [
    {
      organization: mockOrgWithSpace1,
      role: 'member',
    },
    {
      organization: mockOrgWithSpace2,
      role: 'member',
    },
    {
      organization: mockOrgNoSpaces1,
      role: 'owner',
    },
    {
      organization: mockOrgNoSpaces2,
      role: 'developer',
    },
  ],
});

jest.mock('core/services/BrowserStorage', () => {
  const store = {
    get: jest.fn(),
  };

  return {
    getBrowserStorage: () => store,
  };
});

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn(),
  getUserSync: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('core/react-routing', () => ({
  ...jest.requireActual('core/react-routing'),
  router: {
    navigate: jest.fn(),
  },
}));

jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
}));

describe('EmptyHome', () => {
  beforeEach(() => {
    TokenStore.getUserSync.mockReturnValue(mockUser);
    TokenStore.getSpaces.mockResolvedValue([mockSpace2, mockSpace3, mockSpace1]);

    setUser(mockUser);
  });

  describe('loading', () => {});

  describe('without orgId', () => {
    it('should get the last used space from the store and redirect to it', async () => {
      when(getBrowserStorage().get)
        .calledWith('lastUsedSpace')
        .mockReturnValueOnce(mockSpace2.sys.id);

      build();

      await waitFor(() => expect(go).toBeCalled());

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockSpace2.sys.id },
        options: { location: 'replace' },
      });
    });

    it('should get the last used org if the last used space is unavailable', async () => {
      when(getBrowserStorage().get)
        .calledWith('lastUsedOrg')
        .mockReturnValueOnce(mockOrgWithSpace1.sys.id);

      build();

      await waitFor(() => expect(go).toBeCalled());

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockSpace3.sys.id },
        options: { location: 'replace' },
      });
    });

    it('should get the first space otherwise', async () => {
      build();

      await waitFor(() => expect(go).toBeCalled());

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockSpace2.sys.id },
        options: { location: 'replace' },
      });
    });

    it('should redirect to the account settings if no space or org is available', async () => {
      TokenStore.getSpaces.mockResolvedValueOnce([]);

      build();

      await waitFor(() => expect(router.navigate).toBeCalled());

      expect(router.navigate).toBeCalledWith(
        {
          path: 'account.profile.user',
        },
        { location: 'replace' }
      );
    });

    it('should redirect to the error page if an error happens while loading', async () => {
      TokenStore.getSpaces.mockRejectedValueOnce(new Error('oops'));

      build();

      await waitFor(() => expect(router.navigate).toBeCalled());

      expect(router.navigate).toBeCalledWith({
        path: 'error',
      });
    });

    it('should show the admin home if there are no spaces and the user is an org admin/owner', async () => {
      TokenStore.getSpaces.mockResolvedValueOnce([]);

      when(getBrowserStorage().get)
        .calledWith('lastUsedOrg')
        .mockReturnValueOnce(mockOrgNoSpaces1.sys.id);

      build();

      await waitFor(() => expect(screen.getByTestId('cf-ui-empty-space-admin')).toBeVisible());
    });

    it('should allow the user to create a space if they are shown the admin version', async () => {
      TokenStore.getSpaces.mockResolvedValueOnce([]);

      when(getBrowserStorage().get)
        .calledWith('lastUsedOrg')
        .mockReturnValueOnce(mockOrgNoSpaces1.sys.id);

      build();

      await waitFor(() => expect(screen.getByTestId('cf-ui-empty-space-admin')).toBeVisible());

      fireEvent.click(screen.getByTestId('cf-ui-empty-space-admin.create-space'));

      expect(CreateSpace.beginSpaceCreation).toBeCalledWith(mockOrgNoSpaces1.sys.id);
    });

    it('should show the non-admin home if the user is not an org admin/owner', async () => {
      TokenStore.getSpaces.mockResolvedValueOnce([]);

      when(getBrowserStorage().get)
        .calledWith('lastUsedOrg')
        .mockReturnValueOnce(mockOrgNoSpaces2.sys.id);

      build();

      await waitFor(() => expect(screen.getByTestId('cf-ui-empty-space')).toBeVisible());
    });
  });

  describe('with orgId', () => {
    it('should redirect to the first space for the given orgId, regardless of the lastUsedOrg value', async () => {
      when(getBrowserStorage().get)
        .calledWith('lastUsedOrg')
        .mockReturnValueOnce(mockOrgWithSpace2.sys.id);

      build({ orgId: mockOrgWithSpace1.sys.id });

      await waitFor(() => expect(go).toBeCalled());

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockSpace3.sys.id },
        options: { location: 'replace' },
      });
    });

    it('should redirect to the account settings if the orgId does not resolve to an org membership or a space', async () => {
      build({ orgId: mockOtherOrg.sys.id });

      await waitFor(() => expect(router.navigate).toBeCalled());

      expect(router.navigate).toBeCalledWith(
        {
          path: 'account.profile.user',
        },
        { location: 'replace' }
      );
    });

    it('should show the admin view if the org membership for the orgId is admin/owner', async () => {
      build({ orgId: mockOrgNoSpaces1.sys.id });

      await waitFor(() => expect(screen.getByTestId('cf-ui-empty-space-admin')).toBeVisible());
    });

    it('should show the non-admin view if the org membership for the orgId is not admin/owner', async () => {
      build({ orgId: mockOrgNoSpaces2.sys.id });

      await waitFor(() => expect(screen.getByTestId('cf-ui-empty-space')).toBeVisible());
    });
  });
});

function build(customProps) {
  const props = {
    ...customProps,
  };

  render(<EmptyHome {...props} />);
}
