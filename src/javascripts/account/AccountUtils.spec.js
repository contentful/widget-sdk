import * as utils from './AccountUtils.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import { go } from 'states/Navigator.es6';

import * as spaceContextMocked from 'ng/spaceContext';

jest.mock('states/Navigator.es6', () => ({
  go: jest.fn()
}));

jest.mock('services/OrganizationRoles.es6', () => ({
  isOwnerOrAdmin: jest.fn()
}));

spaceContextMocked.getData.mockReturnValue({
  sys: { id: 'my-org-id' }
});

describe('AccountUtils', () => {
  afterAll(() => {
    spaceContextMocked.getData.mockReset();
  });
  beforeEach(() => {
    go.mockReset();
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
