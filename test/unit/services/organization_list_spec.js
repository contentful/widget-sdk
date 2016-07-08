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
    let ORG_1, ORG_2, ORG_3;

    beforeEach(function () {
      ORG_1 = { sys: { id: 'org1' }, name: '1st ORG' };
      ORG_2 = { sys: { id: 'org2' }, name: '2nd ORG' };
      ORG_3 = { sys: { id: 'org3' }, name: '3rd ORG' };

      var user = makeUser([ ORG_1, ORG_2, ORG_3 ]);
      user.organizationMemberships[0].role = 'member';
      user.organizationMemberships[1].role = 'admin';
      user.organizationMemberships[2].role = 'owner';
      OrganizationList.resetWithUser(user);
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
