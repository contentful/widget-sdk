import { invite, progress$ } from './SendOrganizationInvitation.es6';

const mockStubs = {
  invite: jest.fn().mockResolvedValue(true)
};

jest.mock(
  'access_control/OrganizationMembershipRepository.es6',
  () => ({
    invite: (...args) => mockStubs.invite(...args)
  }),
  { virtual: true }
);

jest.mock(
  'data/EndpointFactory.es6',
  () => ({
    createOrganizationEndpoint: jest.fn()
  }),
  { virtual: true }
);

describe('account/SendOrganizationInvitation.es6', () => {
  describe('#invite', () => {
    let emails;

    beforeEach(() => {
      mockStubs.invite.mockClear();

      emails = ['user@example.com', 'user2@example.com'];
    });

    it('should call OrganizationMembershipRepository#invite for each email', async () => {
      await invite({ emails });

      expect(mockStubs.invite).toHaveBeenCalledTimes(2);
    });

    it('should emit a non-error event on the progressBus for each invitation', async () => {
      let busCount = 0;

      progress$.onValue(() => busCount++);

      await invite({ emails });

      expect(busCount).toBe(2);
    });

    it('should emit an error event on progress$ if API rejects', async () => {
      mockStubs.invite.mockRejectedValue(true);

      let busCount = 0;

      progress$.onError(() => busCount++);

      await invite({ emails });

      expect(busCount).toBe(2);

      // Teardown
      mockStubs.invite.mockResolvedValue(true);
    });

    it('should send the orgRole to the API but default to "member"', async () => {
      await invite({ emails, orgRole: 'owner' });

      expect(mockStubs.invite.mock.calls[0][1].role).toBe('owner');

      mockStubs.invite.mockClear();

      await invite({ emails });

      expect(mockStubs.invite.mock.calls[0][1].role).toBe('member');
    });

    it('should send an empty array of spaceInvitations if no space memberships given', async () => {
      await invite({ emails });

      expect(mockStubs.invite.mock.calls[0][1].spaceInvitations).toEqual([]);
    });

    it('should map space memberships and roles to spaceInvitations', async () => {
      const spaceMemberships = {
        space_1234: ['role_1234'],
        space_5678: ['__cf_builtin_admin'],
        space_abcd: ['role_5678', 'role_1234']
      };

      await invite({ emails, spaceMemberships });

      expect(mockStubs.invite.mock.calls[0][1].spaceInvitations).toEqual([
        {
          spaceId: 'space_1234',
          roleIds: ['role_1234']
        },
        {
          spaceId: 'space_5678',
          admin: true
        },
        {
          spaceId: 'space_abcd',
          roleIds: ['role_5678', 'role_1234']
        }
      ]);
    });
  });
});
