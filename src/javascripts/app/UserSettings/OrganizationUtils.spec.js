import { getMemberships } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isOwner as isOrgOwner } from 'services/OrganizationRoles';
import { fetchCanLeaveOrg } from './OrganizationUtils';
import * as fake from 'test/helpers/fakeFactory';

jest.mock('data/EndpointFactory', () => ({
  createOrganizationEndpoint: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn().mockReturnValue(true),
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({ getMemberships: jest.fn() }));

describe('Organization Utils', () => {
  const fakeOrgMembership = fake.Organization();
  const fakeOrgEnpoint = {};
  const queryForOwners = {
    role: 'owner',
    limit: 0,
  };

  createOrganizationEndpoint.mockReturnValue(fakeOrgEnpoint);

  describe('if the user is an Organization Owner', () => {
    describe('fetchCanLeaveOrg', () => {
      it('should call createOrganizationEndpoint with the correct arguement', async () => {
        await fetchCanLeaveOrg(fakeOrgMembership);

        expect(createOrganizationEndpoint).toBeCalledWith(fakeOrgMembership.sys.id);
      });

      it('should call getMemberships with the correct arguements', async () => {
        await fetchCanLeaveOrg(fakeOrgMembership);

        expect(getMemberships).toBeCalledWith(fakeOrgEnpoint, queryForOwners);
      });

      it('should return true when the user is not the only owner left', async () => {
        getMemberships.mockResolvedValue({ total: 2 });

        expect(await fetchCanLeaveOrg(fakeOrgMembership)).toBeTruthy();
      });

      it('should return true if the request fails', async () => {
        getMemberships.mockRejectedValueOnce();

        expect(await fetchCanLeaveOrg(fakeOrgMembership)).toBeTruthy();
      });

      it('should return false when the user is the only owner left', async () => {
        createOrganizationEndpoint.mockReturnValue(fakeOrgEnpoint);

        getMemberships.mockResolvedValue({ total: 1 });

        expect(await fetchCanLeaveOrg(fakeOrgMembership)).toBeFalsy();
      });
    });
  });

  describe('if the user is not an Organization Owner', () => {
    it('should allow the user to leave the org', () => {
      isOrgOwner.mockReturnValue(false);

      expect(fetchCanLeaveOrg(fakeOrgMembership)).toBeTruthy();
    });
  });
});
