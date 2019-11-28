import * as utils from './AccountUtils';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { go } from 'states/Navigator';

import * as spaceContextMocked from 'ng/spaceContext';

jest.mock('states/Navigator', () => ({
  go: jest.fn()
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn()
}));

describe('AccountUtils', () => {
  beforeEach(() => {
    spaceContextMocked.getData.mockReturnValue({
      sys: { id: 'my-org-id' }
    });
    go.mockReset();
  });

  afterAll(() => {
    spaceContextMocked.getData.mockReset();
  });

  const setAdmin = isAdmin => {
    isOwnerOrAdmin.mockReturnValue(isAdmin);
  };

  describe('user is admin or owner', () => {
    beforeEach(() => setAdmin(true));

    it('returns the route state reference for the subscription page', () => {
      const ref = utils.getSubscriptionState();

      expect(ref).toEqual({
        path: ['account', 'organizations', 'subscription'],
        params: {
          orgId: 'my-org-id'
        }
      });
    });

    it('navigates to the subscription page', () => {
      utils.goToSubscription();
      expect(go).toHaveBeenCalledWith({
        path: ['account', 'organizations', 'subscription'],
        params: {
          orgId: 'my-org-id'
        }
      });
    });

    it('navigates to the users page', () => {
      utils.goToUsers();
      expect(go).toHaveBeenCalledWith({
        path: ['account', 'organizations', 'users.list'],
        params: {
          orgId: 'my-org-id'
        }
      });
    });
  });

  describe('user is not admin or owner', () => {
    beforeEach(() => setAdmin(false));

    it('does not reuturn the route state reference for the subscription page', () => {
      const ref = utils.getSubscriptionState();

      expect(ref).toBeNull();
    });

    it('navigates to the subscription page', () => {
      utils.goToSubscription();
      expect(go).not.toHaveBeenCalled();
    });

    it('navigates to the users page', () => {
      utils.goToUsers();
      expect(go).not.toHaveBeenCalled();
    });
  });
});
