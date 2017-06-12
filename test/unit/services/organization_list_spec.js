'use strict';

describe('OrgniaztionList', function () {
  let OrganizationList, ORG_1, ORG_2, ORG_3;
  const UNKNOWN_ORG_ID = 'UNKNOWN_ORG_ID';

  function makeUser (organizations) {
    return {
      organizationMemberships: _.map(organizations, function (org) {
        return { organization: org };
      })
    };
  }

  beforeEach(function () {
    module('contentful/test');
    OrganizationList = this.$inject('services/OrganizationList');

    ORG_1 = { sys: { id: 'org1' }, name: '1st ORG' };
    ORG_2 = { sys: { id: 'org2' }, name: '2nd ORG' };
    ORG_3 = { sys: { id: 'org3' }, name: '3rd ORG' };
  });

  describe('#isEmpty', function () {
    it('returns `false` initially', function () {
      expect(OrganizationList.isEmpty()).toBe(true);
    });

    it('returns `true` if user data is given', function () {
      OrganizationList.resetWithUser(makeUser([ ORG_1 ]));
      expect(OrganizationList.isEmpty()).toBe(false);
    });
  });

  describe('#get', function () {
    beforeEach(function () {
      OrganizationList.setUser(makeUser([ ORG_1, ORG_2 ]));
      OrganizationList.setOrganizations([ ORG_1, ORG_2 ]);
    });

    it('gets organization by id', function () {
      expect(OrganizationList.get(ORG_2.sys.id)).toBe(ORG_2);
    });

    it('returns null for non-existent organization', function () {
      expect(OrganizationList.get(UNKNOWN_ORG_ID)).toBe(null);
    });
  });

  describe('#isAdmin, #isOwner and #isOwnerOrAdmin', function () {
    beforeEach(function () {
      const user = makeUser([ ORG_1, ORG_2, ORG_3 ]);
      user.organizationMemberships[0].role = 'member';
      user.organizationMemberships[1].role = 'admin';
      user.organizationMemberships[2].role = 'owner';
      OrganizationList.setUser(user);
    });

    it('returns `false` if undefined is given',
      () => returnsFalseWithArg(undefined));

    it('returns `false` if null is given',
      () => returnsFalseWithArg(null));

    it('returns `false` for an unknown organization ID',
      () => returnsFalseWithArg('unknown-id'));

    it('returns `false` if user is a normal member', function () {
      returnsFalseWithArg(ORG_1);
    });

    it('returns `false`', function () {
      expect(OrganizationList.isOwner(ORG_2)).toBe(false);
      expect(OrganizationList.isAdmin(ORG_3)).toBe(false);
    });

    it('returns `true`', function () {
      expect(OrganizationList.isAdmin(ORG_2)).toBe(true);
      expect(OrganizationList.isOwner(ORG_3)).toBe(true);
      expect(OrganizationList.isOwnerOrAdmin(ORG_2)).toBe(true);
      expect(OrganizationList.isOwnerOrAdmin(ORG_3)).toBe(true);
    });

    function returnsFalseWithArg (value) {
      expect(OrganizationList.isAdmin(value)).toBe(false);
      expect(OrganizationList.isOwner(value)).toBe(false);
      expect(OrganizationList.isOwnerOrAdmin(value)).toBe(false);
    }
  });

});
