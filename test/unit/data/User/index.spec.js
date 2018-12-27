import * as sinon from 'test/helpers/sinon';
import * as K from 'test/helpers/mocks/kefir';

describe('data/User', () => {
  beforeEach(function() {
    this.tokenStore = {
      organizations$: K.createMockProperty(null),
      user$: K.createMockProperty(null),
      spacesByOrganization$: K.createMockProperty(null)
    };

    this.contentPreview = {
      contentPreviewsBus$: K.createMockProperty({})
    };

    this.spaceContext = {
      publishedCTs: {
        items$: K.createMockProperty([])
      },
      organization: {},
      space: {
        data: {}
      }
    };

    this.$stateParams = {
      orgId: 1
    };

    this.orgs = [
      {
        role: 'owner',
        organization: { sys: { id: 'org-owner' } }
      },
      {
        role: 'member',
        organization: { sys: { id: 'org-member' } }
      }
    ];

    module('contentful/test', $provide => {
      $provide.value('services/TokenStore.es6', this.tokenStore);
      $provide.constant('spaceContext', this.spaceContext);
      $provide.value('$stateParams', this.$stateParams);
      $provide.constant('contentPreview', this.contentPreview);
      $provide.value('data/OrganizationStatus.es6', {
        default: () => ({ then: cb => cb({}) }) // simulate promise for instant resolution
      });
    });

    this.moment = this.$inject('moment');
    this.$rootScope = this.$inject('$rootScope');
    this.utils = this.$inject('data/User');
  });

  describe('#userDataBus$', () => {
    beforeEach(function() {
      this.spy = sinon.spy();
      this.utils.userDataBus$.onValue(this.spy);

      this.set = function(params) {
        const {
          user = K.getValue(this.tokenStore.user$),
          orgs = K.getValue(this.tokenStore.organizations$),
          spacesByOrg = K.getValue(this.tokenStore.spacesByOrganization$),
          org = this.spaceContext.organization,
          orgId,
          space = this.spaceContext.space.data,
          publishedCTs = []
        } = params;

        this.tokenStore.organizations$.set(orgs);
        this.tokenStore.spacesByOrganization$.set(spacesByOrg);
        this.spaceContext.organization = org;
        this.spaceContext.space.data = space;
        this.$stateParams.orgId = orgId;
        this.spaceContext.publishedCTs.items$.set(publishedCTs);
        this.$rootScope.$broadcast('$stateChangeSuccess', null, { orgId });
        this.tokenStore.user$.set(user);
        this.$apply();
      };
    });
    it('emits [user, org, spacesByOrg, space, contentPreviews, publishedCTs, organizationStatus] where space, contentPreviews, publishedCTs and organizationStatus are optional', function() {
      const user = { email: 'a@b.c' };
      const orgs = [{ name: '1', sys: { id: 1 } }, { name: '2', sys: { id: 2 } }];
      const org = { name: 'some org', sys: { id: 'some-org-1' } };

      sinon.assert.notCalled(this.spy);

      this.set({ user, orgs, spacesByOrg: {}, org: null, orgId: 1, publishedCTs: [] });
      sinon.assert.calledOnce(this.spy);

      sinon.assert.calledWithExactly(this.spy, [
        user,
        orgs[0],
        {},
        this.spaceContext.space.data,
        {},
        [],
        {}
      ]);

      this.spy.reset();
      this.set({ org });
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [
        user,
        org,
        {},
        this.spaceContext.space.data,
        {},
        [],
        {}
      ]);

      this.spy.reset();
      this.set({ org: null, space: { fields: [], sys: { id: 'space-1' } } });
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [
        user,
        orgs[0],
        {},
        this.spaceContext.space.data,
        {},
        [],
        {}
      ]);
    });
    it('emits a value only when the user is valid and the org and spacesByOrg are not falsy', function() {
      const orgs = [{ name: '1', sys: { id: 1 } }, { name: '2', sys: { id: 2 } }];
      const user = { email: 'a@b' };

      // invalid user
      this.set({ user: null });
      sinon.assert.notCalled(this.spy);

      // valid user but org is falsy since org prop init val is null
      this.set({ user });
      sinon.assert.notCalled(this.spy);

      // spaces by org map is null
      this.set({ user, orgs, spacesByOrg: null, orgId: 1 });
      sinon.assert.notCalled(this.spy);

      // all valid valus, hence spy must be called
      this.set({ user, orgs, spacesByOrg: {}, orgId: 1 });
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, {}, {}, [], {}]);
    });
    it('skips duplicates', function() {
      const setter = this.set.bind(this, {
        user: { email: 'a@b.c' },
        org: { name: 'org-1', sys: { id: 1 } },
        spacesByOrg: {},
        space: { name: 'space-1', sys: { id: 'space-1' } },
        publishedCTs: []
      });
      setter();
      sinon.assert.calledOnce(this.spy);
      setter();
      sinon.assert.calledOnce(this.spy);
      this.set({ space: null });
      sinon.assert.calledTwice(this.spy);
    });
  });

  describe('#getOrgRole', () => {
    it('returns the role the user has for a given orgId', function() {
      const role = 'some role';
      const orgId = 'org-1';
      const user = {
        organizationMemberships: [{ role, organization: { sys: { id: orgId } } }]
      };
      const foundRole = this.utils.getOrgRole(user, orgId);

      expect(foundRole).toEqual(role);
    });
    it('returns undefined when org with given org id is not found', function() {
      const foundRole = this.utils.getOrgRole(
        [{ role: 'potato', organization: { sys: { id: 1 } } }],
        2
      );

      expect(foundRole).toEqual(null);
    });
  });

  describe('#getUserAgeInDays', () => {
    it("gets the user's age in days for older dates", function() {
      const diff = 7;
      const creationDate = this.moment().subtract(diff, 'days');

      expect(this.utils.getUserAgeInDays({ sys: { createdAt: creationDate.toISOString() } })).toBe(
        diff
      );
    });
    it('returns null if the operation throws', function() {
      expect(
        Number.isNaN(this.utils.getUserAgeInDays({ sys: { createdAt: 'some wrong date' } }))
      ).toBe(true);
    });
  });

  describe('#getUserCreationDateUnixTimestamp', () => {
    it('should return the user creation date as a unix timestamp', function() {
      const creationDate = this.moment();

      expect(
        this.utils.getUserCreationDateUnixTimestamp({
          sys: { createdAt: creationDate.toISOString() }
        })
      ).toBe(creationDate.unix());
    });
  });

  describe('#hasAnOrgWithSpaces', () => {
    it('returns true if any of the orgs user belongs to has one or more spaces', function() {
      expect(this.utils.hasAnOrgWithSpaces({ org1: [1, 2] })).toBe(true);
      expect(this.utils.hasAnOrgWithSpaces({ org1: [1, 2], org2: [] })).toBe(true);
    });
    it('returns false otherwise', function() {
      expect(this.utils.hasAnOrgWithSpaces({})).toBe(false);
      expect(this.utils.hasAnOrgWithSpaces({ org1: [], org2: [] })).toBe(false);
    });
  });

  describe('#ownsAtleastOneOrg', () => {
    it('returns true if user owns at least on org', function() {
      expect(this.utils.ownsAtleastOneOrg({ organizationMemberships: this.orgs })).toBe(true);
    });
    it('returns false otherwise', function() {
      expect(this.utils.ownsAtleastOneOrg({ organizationMemberships: [this.orgs[1]] })).toBe(false);
      expect(this.utils.ownsAtleastOneOrg({ organizationMemberships: [] })).toBe(false);
      expect(this.utils.ownsAtleastOneOrg({})).toBe(false);
    });
  });

  describe('#getOwnedOrgs', () => {
    it('returns a list of orgs the user is an owner of', function() {
      expect(this.utils.getOwnedOrgs({ organizationMemberships: this.orgs })).toEqual([
        this.orgs[0]
      ]);
    });
    it('returns an empty list if user owns no orgs', function() {
      expect(this.utils.getOwnedOrgs({ organizationMemberships: [this.orgs[1]] })).toEqual([]);
    });
  });

  describe('#getFirstOwnedOrgWithoutSpaces', () => {
    beforeEach(function() {
      this.testGetFirstOwnedOrgWithoutSpaces = (spacesByOrg, assertion) => {
        const org = this.utils.getFirstOwnedOrgWithoutSpaces(
          {
            organizationMemberships: this.orgs
          },
          spacesByOrg
        );

        assertion(org);
      };
    });
    it('returns the first org the user owns that has no spaces', function() {
      this.testGetFirstOwnedOrgWithoutSpaces({ 'org-owner': [] }, org =>
        expect(org).toBe(this.orgs[0].organization)
      );
      this.testGetFirstOwnedOrgWithoutSpaces({}, org =>
        expect(org).toBe(this.orgs[0].organization)
      );
    });
    it('returns undefined otherwise', function() {
      this.testGetFirstOwnedOrgWithoutSpaces({ 'org-owner': [1] }, org =>
        expect(org).toBe(undefined)
      );
    });
  });

  describe('#isAutomationTestUser', () => {
    beforeEach(function() {
      this.assertOnEmails = function(emails, value) {
        emails.forEach(email => {
          expect(this.utils.isAutomationTestUser({ email })).toEqual(value);
        });
      };
    });

    it('returns true for users whose email matches the automation test user email pattern', function() {
      const userEmails = [
        'autotest+quirely_orgowner_worker1@contentful.com',
        'autotest+flinkly_orgowner_worker1@contentful.com',
        'autotest+flinkly_orgmember_worker1@contentful.com',
        'autotest+flinkly_orgmember_developer@contentful.com',
        'autotest+flinkly_newuser_1235_1235@contentful.com'
      ];

      this.assertOnEmails(userEmails, true);
    });

    it('returns false for all non test automation users', function() {
      const userEmails = [
        'potato@contentful.com',
        'autotest@contentful.com',
        'something@gmail.com',
        'omg@bbq.net'
      ];

      this.assertOnEmails(userEmails, false);
    });
  });

  describe('#isUserOrgCreator', () => {
    const makeUserWithId = id => ({ sys: { id } });
    const makeOrgCreatedByUserWithId = id => ({ sys: { createdBy: { sys: { id } } } });

    it('returns true if the current org was created by the current user', function() {
      expect(this.utils.isUserOrgCreator(makeUserWithId(1), makeOrgCreatedByUserWithId(1))).toEqual(
        true
      );
    });

    it('returns false if the current org was not created by the current user', function() {
      expect(this.utils.isUserOrgCreator(makeUserWithId(1), makeOrgCreatedByUserWithId(2))).toEqual(
        false
      );
    });

    it('throws if user is malformed', function() {
      expect(() => this.utils.isUserOrgCreator({}, makeOrgCreatedByUserWithId(1))).toThrow(
        new Error('Expected user to be an object')
      );
    });

    it('throws if org is malformed', function() {
      expect(() => this.utils.isUserOrgCreator(makeUserWithId(42), {})).toThrow(
        new Error('Expected org to be an object')
      );
    });
  });

  describe('#getUserSpaceRoles', () => {
    it('includes "admin" in the array in case of admin', function() {
      const space = {
        spaceMembership: {
          admin: true,
          roles: []
        }
      };
      const roles = this.utils.getUserSpaceRoles(space);
      expect(roles).toContain('admin');
    });

    it('does not include "admin" in the array in case of not admin', function() {
      const space = {
        spaceMembership: {
          admin: false,
          roles: [{ name: 'Some' }]
        }
      };
      const roles = this.utils.getUserSpaceRoles(space);
      expect(roles).toEqual(['some']);
    });

    it('converts role names to lowercase', function() {
      const space = {
        spaceMembership: {
          admin: false,
          roles: [{ name: 'SoMe' }]
        }
      };
      const roles = this.utils.getUserSpaceRoles(space);
      expect(roles).toContain('some');
    });
  });
});
