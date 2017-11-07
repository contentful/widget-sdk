import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('data/User', () => {
  beforeEach(function () {
    this.tokenStore = {
      organizations$: K.createMockProperty(null),
      user$: K.createMockProperty(null),
      spacesByOrganization$: K.createMockProperty(null)
    };

    this.spaceContext = {
      organizationContext: {
        organization: {}
      },
      space: {
        data: {}
      }
    };

    this.$stateParams = {
      orgId: 1
    };

    this.orgs = [{
      role: 'owner',
      organization: {sys: {id: 'org-owner'}}
    }, {
      role: 'member',
      organization: {sys: {id: 'org-member'}}
    }];

    module('contentful/test', $provide => {
      $provide.value('services/TokenStore', this.tokenStore);
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('$stateParams', this.$stateParams);
    });

    this.moment = this.$inject('moment');
    this.$rootScope = this.$inject('$rootScope');
    this.utils = this.$inject('data/User');
  });

  describe('#userDataBus$', function () {
    beforeEach(function () {
      this.spy = sinon.spy();
      this.utils.userDataBus$.onValue(this.spy);

      this.set = function (params) {
        const {
          user = K.getValue(this.tokenStore.user$),
          orgs = K.getValue(this.tokenStore.organizations$),
          spacesByOrg = K.getValue(this.tokenStore.spacesByOrganization$),
          org = this.spaceContext.organizationContext.organization,
          orgId,
          space = this.spaceContext.space.data
        } = params;

        this.tokenStore.user$.set(user);
        this.tokenStore.organizations$.set(orgs);
        this.tokenStore.spacesByOrganization$.set(spacesByOrg);
        this.spaceContext.organizationContext.organization = org;
        this.spaceContext.space.data = space;
        this.$stateParams.orgId = orgId;
        this.$rootScope.$broadcast('$stateChangeSuccess', null, {orgId});
        this.$apply();
      };
    });
    it('should emit [user, org, spacesByOrg, space] where space is optional', function () {
      const user = {email: 'a@b.c'};
      const orgs = [{name: '1', sys: {id: 1}}, {name: '2', sys: {id: 2}}];
      const org = {name: 'some org', sys: {id: 'some-org-1'}};

      sinon.assert.notCalled(this.spy);

      this.set({user, orgs, spacesByOrg: {}, org: null, orgId: 1});
      sinon.assert.calledOnce(this.spy);

      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, this.spaceContext.space.data]);

      this.spy.reset();
      this.set({org});
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(
        this.spy,
        [user, org, {}, this.spaceContext.space.data]
      );

      this.spy.reset();
      this.set({org: null, space: {fields: [], sys: {id: 'space-1'}}});
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, this.spaceContext.space.data]);
    });
    it('should emit a value only when the user is valid and the org and spacesByOrg are not falsy', function () {
      const orgs = [{name: '1', sys: {id: 1}}, {name: '2', sys: {id: 2}}];
      const user = {email: 'a@b'};

      // invalid user
      this.set({user: null});
      sinon.assert.notCalled(this.spy);

      // valid user but org is falsy since org prop init val is null
      this.set({user});
      sinon.assert.notCalled(this.spy);

      // spaces by org map is null
      this.set({user, orgs, spacesByOrg: null, orgId: 1});
      sinon.assert.notCalled(this.spy);

      // all valid valus, hence spy must be called
      this.set({user, orgs, spacesByOrg: {}, orgId: 1});
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, {}]);
    });
    it('should skip duplicates', function () {
      const setter = this.set.bind(this, {
        user: {email: 'a@b.c'},
        org: {name: 'org-1', sys: {id: 1}},
        spacesByOrg: {},
        space: {name: 'space-1', sys: {id: 'space-1'}}
      });
      setter();
      sinon.assert.calledOnce(this.spy);
      setter();
      sinon.assert.calledOnce(this.spy);
      this.set({space: null});
      sinon.assert.calledTwice(this.spy);
    });
  });

  describe('#getOrgRole', function () {
    it('should return the role the user has for a given orgId', function () {
      const role = 'some role';
      const orgId = 'org-1';
      const user = {
        organizationMemberships: [{role, organization: {sys: {id: orgId}}}]
      };
      const foundRole = this.utils.getOrgRole(user, orgId);

      expect(foundRole).toEqual(role);
    });
    it('should return undefined when org with given org id is not found', function () {
      const foundRole = this.utils.getOrgRole([
        {role: 'potato', organization: {sys: {id: 1}}}
      ], 2);

      expect(foundRole).toEqual(null);
    });
  });

  describe('#getUserAgeInDays', function () {
    it('should get the user\'s age in days for older dates', function () {
      const diff = 7;
      const creationDate = this.moment().subtract(diff, 'days');

      expect(this.utils.getUserAgeInDays({sys: {createdAt: creationDate.toISOString()}})).toBe(diff);
    });
    it('should return null if the operation throws', function () {
      expect(Number.isNaN(this.utils.getUserAgeInDays({sys: {createdAt: 'some wrong date'}}))).toBe(true);
    });
  });

  describe('#isNonPayingUser', function () {
    beforeEach(function () {
      this.checkIfUserIsNonpaying = function (subscriptionStatus, valToAssert) {
        const isNonPayingUser = this.utils.isNonPayingUser({
          organizationMemberships: [{
            organization: {subscription: {status: subscriptionStatus}}
          }]
        });

        expect(isNonPayingUser).toBe(valToAssert);
      };
    });

    it('should return true if any org a user belongs to is paying us and false otherwise', function () {
      this.checkIfUserIsNonpaying('free', true);
      this.checkIfUserIsNonpaying('trial', true);
      this.checkIfUserIsNonpaying('paid', false);
      this.checkIfUserIsNonpaying('free_paid', false);
    });
  });

  describe('#hasAnOrgWithSpaces', function () {
    it('should return true if any of the orgs user belongs to has one or more spaces', function () {
      expect(this.utils.hasAnOrgWithSpaces({org1: [1, 2]})).toBe(true);
      expect(this.utils.hasAnOrgWithSpaces({org1: [1, 2], org2: []})).toBe(true);
    });
    it('should return false otherwise', function () {
      expect(this.utils.hasAnOrgWithSpaces({})).toBe(false);
      expect(this.utils.hasAnOrgWithSpaces({org1: [], org2: []})).toBe(false);
    });
  });

  describe('#ownsAtleastOneOrg', function () {
    it('should return true if user owns at least on org', function () {
      expect(this.utils.ownsAtleastOneOrg({organizationMemberships: this.orgs})).toBe(true);
    });
    it('should return false otherwise', function () {
      expect(this.utils.ownsAtleastOneOrg({organizationMemberships: [this.orgs[1]]})).toBe(false);
      expect(this.utils.ownsAtleastOneOrg({organizationMemberships: []})).toBe(false);
      expect(this.utils.ownsAtleastOneOrg({})).toBe(false);
    });
  });

  describe('#getOwnedOrgs', function () {
    it('should return a list of orgs the user is an owner of', function () {
      expect(this.utils.getOwnedOrgs({organizationMemberships: this.orgs})).toEqual([this.orgs[0]]);
    });
    it('should return an empty list if user owns no orgs', function () {
      expect(this.utils.getOwnedOrgs({organizationMemberships: [this.orgs[1]]})).toEqual([]);
    });
  });

  describe('#getFirstOwnedOrgWithoutSpaces', function () {
    beforeEach(function () {
      this.testGetFirstOwnedOrgWithoutSpaces = (spacesByOrg, assertion) => {
        const org = this.utils.getFirstOwnedOrgWithoutSpaces({
          organizationMemberships: this.orgs
        }, spacesByOrg);

        assertion(org);
      };
    });
    it('should return the first org the user owns that has no spaces', function () {
      this.testGetFirstOwnedOrgWithoutSpaces({'org-owner': []}, org => expect(org).toBe(this.orgs[0].organization));
      this.testGetFirstOwnedOrgWithoutSpaces({}, org => expect(org).toBe(this.orgs[0].organization));
    });
    it('should return undefined otherwise', function () {
      this.testGetFirstOwnedOrgWithoutSpaces({'org-owner': [1]}, org => expect(org).toBe(undefined));
    });
  });

  describe('#isAutomationTestUser', function () {
    beforeEach(function () {
      this.assertOnEmails = function (emails, value) {
        emails.forEach(email => {
          expect(this.utils.isAutomationTestUser({ email })).toEqual(value);
        });
      };
    });

    it('should return true for users whose email matches the automation test user email pattern', function () {
      const userEmails = [
        'vlad+autotesting_newuser14288_20171026_071249@contentful.com',
        'askld+autotesting_newuser1_2_3@contentful.com',
        'a+autotesting_newuser1_2_3@contentful.com'
      ];

      this.assertOnEmails(userEmails, true);
    });

    it('should return false for all non test automation users', function () {
      const userEmails = [
        '+autotesting_newuser14288_20171026_071249@contentful.com',
        'a+autostesting_newuser1_2_3@contentful.com',
        'a+autotesting_newusers1_2_3@contentful.com',
        'a+autotesting_newuser2_3@contentful.com',
        'askld+autotesting_newuser_2_3@contentful.com',
        'askld+autotesting_newuser1_2@contentful.com',
        'askld+autotesting_newuser1_2_@contentful.com',
        'askld+autotesting_newuser1_2_3@contentful.org',
        'askld+autotesting_newuser1_2_3@contentfuls.com',
        'askld+autotesting_newuser1_2_3contentful.com',
        'askld+autotesting_newsuser1_2_3@contentful.com',
        'a@b.net',
        'a@b.net.org',
        'äå@éö.potato'
      ];

      this.assertOnEmails(userEmails, false);
    });
  });

  describe('#isOrgCreator', function () {
    it('should return true if the current org was created by the current user', function () {
      expect(this.utils.isOrgCreator({sys: {id: 1}}, {sys: {createdBy: {sys: {id: 1}}}})).toEqual(true);
    });

    it('should return false if the current org was not created by the current user', function () {
      expect(this.utils.isOrgCreator({sys: {id: 1}}, {sys: {createdBy: {sys: {id: 2}}}})).toEqual(false);
    });

    it('should throw if user or org are malformed', function () {
      expect(this.utils.isOrgCreator.bind(this.utils)).toThrow();
    });
  });
});
