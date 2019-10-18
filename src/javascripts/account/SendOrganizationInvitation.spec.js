import { sendInvites, progress$ } from './SendOrganizationInvitation';

const mockStubs = {
  invite: jest.fn().mockResolvedValue(true),
  createOrgMembership: jest.fn().mockResolvedValue(true),
  SpaceMembershipRepository_create_invite: jest.fn().mockResolvedValue(true)
};

jest.mock(
  'access_control/OrganizationMembershipRepository',
  () => ({
    invite: (...args) => mockStubs.invite(...args),
    createOrgMembership: () => mockStubs.createOrgMembership()
  }),
  { virtual: true }
);

jest.mock(
  'data/EndpointFactory.es6',
  () => ({
    createOrganizationEndpoint: jest.fn(),
    createSpaceEndpoint: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  'access_control/SpaceMembershipRepository',
  () => ({
    create: jest.fn().mockReturnValue({
      invite: () => mockStubs.SpaceMembershipRepository_create_invite()
    })
  }),
  { virtual: true }
);

describe('account/SendOrganizationInvitation', () => {
  describe('#invite', () => {
    const emails = ['user@example.com', 'user2@example.com'];
    const spaceMemberships = {
      space_1234: ['role_1234'],
      space_5678: ['__cf_builtin_admin'],
      space_abcd: ['role_5678', 'role_1234']
    };

    beforeEach(() => {
      mockStubs.invite.mockClear();
      mockStubs.invite.mockResolvedValue(true);
    });

    it('should call OrganizationMembershipRepository#invite for each email', async () => {
      await sendInvites({ emails });

      expect(mockStubs.invite).toHaveBeenCalledTimes(2);
    });

    it('should emit a non-error event on the progressBus for each invitation', async () => {
      let busCount = 0;

      progress$.onValue(() => busCount++);

      await sendInvites({ emails });

      expect(busCount).toBe(2);
    });

    it('should emit an error event on progress$ if API rejects', async () => {
      mockStubs.invite.mockRejectedValue(true);

      let busCount = 0;

      progress$.onError(() => busCount++);

      await sendInvites({ emails });

      expect(busCount).toBe(2);
    });

    it('should send the orgRole to the API but default to "member"', async () => {
      await sendInvites({ emails, orgRole: 'owner' });

      expect(mockStubs.invite.mock.calls[0][1].role).toBe('owner');

      mockStubs.invite.mockClear();

      await sendInvites({ emails });

      expect(mockStubs.invite.mock.calls[0][1].role).toBe('member');
    });

    it('should send an empty array of spaceInvitations if no space memberships given', async () => {
      await sendInvites({ emails });

      expect(mockStubs.invite.mock.calls[0][1].spaceInvitations).toEqual([]);
    });

    it('should map space memberships and roles to spaceInvitations', async () => {
      await sendInvites({ emails, spaceMemberships });

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
