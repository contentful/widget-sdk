'use strict';

describe('OrganizationRoles', () => {
  let OrganizationRoles, ORG_1, ORG_2, ORG_3;

  function makeUser(organizations) {
    return {
      organizationMemberships: _.map(organizations, org => ({
        organization: org
      }))
    };
  }

  beforeEach(function() {
    module('contentful/test');
    OrganizationRoles = this.$inject('services/OrganizationRoles.es6');

    ORG_1 = { sys: { id: 'org1' }, name: '1st ORG' };
    ORG_2 = { sys: { id: 'org2' }, name: '2nd ORG' };
    ORG_3 = { sys: { id: 'org3' }, name: '3rd ORG' };
  });

  describe('#isAdmin, #isOwner and #isOwnerOrAdmin', () => {
    beforeEach(() => {
      const user = makeUser([ORG_1, ORG_2, ORG_3]);
      user.organizationMemberships[0].role = 'member';
      user.organizationMemberships[1].role = 'admin';
      user.organizationMemberships[2].role = 'owner';
      OrganizationRoles.setUser(user);
    });

    it('returns `false` if undefined is given', () => returnsFalseWithArg(undefined));

    it('returns `false` if null is given', () => returnsFalseWithArg(null));

    it('returns `false` for an unknown organization ID', () => returnsFalseWithArg('unknown-id'));

    it('returns `false` if user is a normal member', () => {
      returnsFalseWithArg(ORG_1);
    });

    it('returns `false`', () => {
      expect(OrganizationRoles.isOwner(ORG_2)).toBe(false);
      expect(OrganizationRoles.isAdmin(ORG_3)).toBe(false);
    });

    it('returns `true`', () => {
      expect(OrganizationRoles.isAdmin(ORG_2)).toBe(true);
      expect(OrganizationRoles.isOwner(ORG_3)).toBe(true);
      expect(OrganizationRoles.isOwnerOrAdmin(ORG_2)).toBe(true);
      expect(OrganizationRoles.isOwnerOrAdmin(ORG_3)).toBe(true);
    });

    function returnsFalseWithArg(value) {
      expect(OrganizationRoles.isAdmin(value)).toBe(false);
      expect(OrganizationRoles.isOwner(value)).toBe(false);
      expect(OrganizationRoles.isOwnerOrAdmin(value)).toBe(false);
    }
  });
});
