'use strict';

describe('OrgniaztionList', function () {
  var OrganizationList;

  function makeUser (organizations) {
    return {
      organizationMemberships: _.map(organizations, function (org) {
        return { organization: org };
      })
    };
  }

  beforeEach(function () {
    module('contentful/test');
    OrganizationList = this.$inject('OrganizationList');
  });

  describe('#resetWithUser', function () {
    it('initially stores empty list', function () {
      expect(OrganizationList.isEmpty()).toBe(true);
      expect(OrganizationList.getAll().length).toBe(0);
    });

    it('initializes with user data', function () {
      OrganizationList.resetWithUser(makeUser([
        { name: 'org1' }, { name: 'org2' }
      ]));
      expect(OrganizationList.isEmpty()).toBe(false);
      expect(OrganizationList.getAll().length).toBe(2);
      expect(OrganizationList.getAll()[ 1 ].name).toBe('org2');
    });
  });

  describe('#get', function () {
    it('gets organization by id', function () {
      var second = { sys: { id: '2' } };
      OrganizationList.resetWithUser(makeUser([
        { sys: { id: '1' } }, second
      ]));
      expect(OrganizationList.get('2')).toBe(second);
    });

    it('returns null for non-existent organization', function () {
      OrganizationList.resetWithUser(makeUser([]));
      expect(OrganizationList.get('non-existent')).toBe(null);
    });
  });

  describe('#getName', function () {
    it('gets organization name', function () {
      OrganizationList.resetWithUser(
        makeUser([ { name: 'orgname', sys: { id: '123' } } ]));
      expect(OrganizationList.getName('123')).toEqual('orgname');
    });

    it('gets no organization name', function () {
      OrganizationList.resetWithUser(makeUser([]));
      expect(OrganizationList.getName('123')).toEqual('');
    });
  });

  describe('#isAdmin, #isOwner and #isOwnerOrAdmin', function () {
    beforeEach(function () {
      var user = makeUser([ { sys: { id: '123' } }, { sys: { id: '456' } } ]);
      this.memberships = user.organizationMemberships;
      OrganizationList.resetWithUser(user);
    });

    it('returns false if undefined is given',
      () => returnsFalseWithArg(undefined));

    it('returns false if null is given',
      () => returnsFalseWithArg(null));

    it('returns false for an unknown organization ID',
      () => returnsFalseWithArg('unknown-id'));

    it('returns false if user is a normal member', function () {
      this.memberships[ 0 ].role = 'member';
      returnsFalseWithArg('123');
    });

    it('returns true if is an owner or an admin', function () {
      this.memberships[ 0 ].role = 'admin';
      this.memberships[ 1 ].role = 'owner';
      expect(OrganizationList.isAdmin('123')).toBe(true);
      expect(OrganizationList.isAdmin('456')).toBe(false);
      expect(OrganizationList.isOwner('123')).toBe(false);
      expect(OrganizationList.isOwner('456')).toBe(true);
      expect(OrganizationList.isOwnerOrAdmin('123')).toBe(true);
      expect(OrganizationList.isOwnerOrAdmin('456')).toBe(true);
    });

    function returnsFalseWithArg (value) {
      expect(OrganizationList.isAdmin(value)).toBe(false);
      expect(OrganizationList.isOwner(value)).toBe(false);
      expect(OrganizationList.isOwnerOrAdmin(value)).toBe(false);
    }
  });
});
