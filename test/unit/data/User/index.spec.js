import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('data/User', () => {
  beforeEach(function () {
    this.tokenStore = {
      organizations$: K.createMockProperty(null),
      user$: K.createMockProperty(null),
      spacesByOrganization$: K.createMockProperty(null)
    };

    this.contentPreview = {
      contentPreviewsBus$: K.createMockProperty({})
    };

    this.endpointFactory = {
      createOrganizationEndpoint: () => {}
    };

    this.pricingDataProvider = {
      getSubscriptionPlans: () => Promise.resolve(this.plans)
    };

    this.spaceContext = {
      publishedCTs: {
        items$: K.createMockProperty([])
      },
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
      $provide.value('contentPreview', this.contentPreview);
      $provide.value('account/pricing/PricingDataProvider', this.pricingDataProvider);
      $provide.value('data/EndpointFactory', this.endpointFactory);
    });

    this.moment = this.$inject('moment');
    this.$rootScope = this.$inject('$rootScope');
    this.utils = this.$inject('data/User');
  });

  describe('#userDataBus$', function () {
    beforeEach(function () {
      this.spy = sinon.spy();
      this.utils.userDataBus$.onValue(this.spy);

      this.set = async function (params) {
        const {
          user = K.getValue(this.tokenStore.user$),
          orgs = K.getValue(this.tokenStore.organizations$),
          spacesByOrg = K.getValue(this.tokenStore.spacesByOrganization$),
          org = this.spaceContext.organizationContext.organization,
          orgId,
          space = this.spaceContext.space.data,
          publishedCTs = []
        } = params;

        this.tokenStore.organizations$.set(orgs);
        this.tokenStore.spacesByOrganization$.set(spacesByOrg);
        this.spaceContext.organizationContext.organization = org;
        this.spaceContext.space.data = space;
        this.$stateParams.orgId = orgId;
        this.spaceContext.publishedCTs.items$.set(publishedCTs);
        this.$rootScope.$broadcast('$stateChangeSuccess', null, {orgId});
        this.tokenStore.user$.set(user);
        // we need to wait next tick, so all promises will be resolved
        // we resolve mocked functions immediately, so they are executed as microtasks
        // and results will be available at the next tick
        await new Promise(resolve => setTimeout(resolve, 0));
      };
    });
    it('should emit [user, org, spacesByOrg, space, contentPreviews, publishedCTs, pricing] where space, contentPreviews and publishedCTs are optional', async function () {
      const orgs = [{name: '1', sys: {id: 1}}, {name: '2', sys: {id: 2}}];
      const user = {email: 'a@b.c', organizationMemberships: [{ organization: orgs[0] }]};
      const org = {name: 'some org', sys: {id: 'some-org-1'}};

      sinon.assert.notCalled(this.spy);

      const pricing = [{ version: 'v1', organization: orgs[0] }];
      await this.set({user, orgs, spacesByOrg: {}, org: null, orgId: 1, publishedCTs: []});
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, this.spaceContext.space.data, {}, [], pricing]);

      this.spy.reset();
      await this.set({org});
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(
        this.spy,
        [user, org, {}, this.spaceContext.space.data, {}, [], pricing]
      );

      this.spy.reset();
      await this.set({org: null, space: {fields: [], sys: {id: 'space-1'}}});
      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, this.spaceContext.space.data, {}, [], pricing]);
    });
    it('should emit a value only when the user is valid and the org and spacesByOrg are not falsy', async function () {
      const orgs = [{name: '1', sys: {id: 1}}, {name: '2', sys: {id: 2}}];
      const user = {email: 'a@b', organizationMemberships: [{ organization: orgs[1] }]};
      const pricing = [{ version: 'v1', organization: orgs[1] }];

      // invalid user
      await this.set({user: null});
      sinon.assert.notCalled(this.spy);

      // valid user but org is falsy since org prop init val is null
      await this.set({user});

      sinon.assert.notCalled(this.spy);

      // spaces by org map is null
      await this.set({user, orgs, spacesByOrg: null, orgId: 1});

      sinon.assert.notCalled(this.spy);

      // all valid valus, hence spy must be called
      await this.set({user, orgs, spacesByOrg: {}, orgId: 1});

      sinon.assert.calledOnce(this.spy);
      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, {}, {}, [], pricing]);
    });
    it('should skip duplicates', async function () {
      const setter = this.set.bind(this, {
        user: {email: 'a@b.c', organizationMemberships: [{ organization: { sys: { id: 'some' } } }]},
        org: {name: 'org-1', sys: {id: 1}},
        spacesByOrg: {},
        space: {name: 'space-1', sys: {id: 'space-1'}},
        publishedCTs: []
      });
      await setter();

      sinon.assert.calledOnce(this.spy);
      await setter();

      sinon.assert.calledOnce(this.spy);
      await this.set({space: null});

      sinon.assert.calledTwice(this.spy);
    });
    it('should emit correct pricing object', async function () {
      const v1org = {name: '1', sys: {id: 1}};
      const v2org = {name: '2', pricingVersion: 'pricing_version_2', sys: {id: 2}};
      this.plans = [{ sys: {id: 'space_plan_id'} }];
      const orgs = [v1org, v2org];
      const organizationMemberships = orgs.map(organization => ({ organization }));
      const user = {email: 'a@b', organizationMemberships};
      await this.set({user, orgs, spacesByOrg: {}, orgId: 1});

      const pricing = [{
        version: 'v1',
        organization: v1org
      }, {
        version: 'v2',
        organization: v2org,
        plans: this.plans
      }];

      sinon.assert.calledWithExactly(this.spy, [user, orgs[0], {}, {}, {}, [], pricing]);
    });
    it('should not emit actions if no pricing data', async function () {
      const orgs = [{name: '1', sys: {id: 1}}, {name: '2', sys: {id: 2}}];
      const user = {email: 'a@b', organizationMemberships: []};
      await this.set({user, orgs, spacesByOrg: {}, orgId: 1});

      sinon.assert.notCalled(this.spy);
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

  describe('#getUserCreationDateUnixTimestamp', function () {
    it('should return the user creation date as a unix timestamp', function () {
      const creationDate = this.moment();

      expect(this.utils.getUserCreationDateUnixTimestamp({
        sys: { createdAt: creationDate.toISOString() }
      })).toBe(creationDate.unix());
    });
  });

  describe('#isNonPayingUser', function () {
    beforeEach(function () {
      this.checkIfUserIsNonpaying = function (subscriptionStatus, valToAssert) {
        const isNonPayingUser = this.utils.isNonPayingUser([{
          version: 'v1',
          organization: {subscription: {status: subscriptionStatus}}
        }]);

        expect(isNonPayingUser).toBe(valToAssert);
      };
    });

    it('should return true if any org a user belongs to is paying us and false otherwise in v1', function () {
      this.checkIfUserIsNonpaying('free', true);
      this.checkIfUserIsNonpaying('trial', true);
      this.checkIfUserIsNonpaying('paid', false);
      this.checkIfUserIsNonpaying('free_paid', false);
    });

    it('should return true if user has v2 org without any plans', function () {
      const isNonPayingUser = this.utils.isNonPayingUser([
        { version: 'v2', plans: {items: []} }
      ]);

      expect(isNonPayingUser).toBe(true);
    });

    it('should return false if user has v2 org with plans', function () {
      const isNonPayingUser = this.utils.isNonPayingUser([
        { version: 'v2', plans: {items: [{ sys: { id: 'a' } }]} }
      ]);

      expect(isNonPayingUser).toBe(false);
    });

    it('should return false if v1 org is paying and v2 is not', function () {
      const isNonPayingUser = this.utils.isNonPayingUser([
        { version: 'v1', organization: {subscription: {status: 'paid'}} },
        { version: 'v2', plans: {items: []} }
      ]);

      expect(isNonPayingUser).toBe(false);
    });

    it('should return false if v1 org is not paying and v2 is paying', function () {
      const isNonPayingUser = this.utils.isNonPayingUser([
        { version: 'v1', organization: {subscription: {status: 'free'}} },
        { version: 'v2', plans: {items: [{ sys: { id: 'some' } }]} }
      ]);

      expect(isNonPayingUser).toBe(false);
    });

    it('should return true if v1 and v2 orgs are not paying', function () {
      const isNonPayingUser = this.utils.isNonPayingUser([
        { version: 'v1', organization: {subscription: {status: 'free'}} },
        { version: 'v2', plans: {items: []} }
      ]);

      expect(isNonPayingUser).toBe(true);
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
        'autotest+quirely_orgowner_worker1@contentful.com',
        'autotest+flinkly_orgowner_worker1@contentful.com',
        'autotest+flinkly_orgmember_worker1@contentful.com',
        'autotest+flinkly_orgmember_developer@contentful.com',
        'autotest+flinkly_newuser_1235_1235@contentful.com'
      ];

      this.assertOnEmails(userEmails, true);
    });

    it('should return false for all non test automation users', function () {
      const userEmails = [
        'potato@contentful.com',
        'autotest@contentful.com',
        'something@gmail.com',
        'omg@bbq.net'
      ];

      this.assertOnEmails(userEmails, false);
    });
  });

  describe('#isUserOrgCreator', function () {
    it('should return true if the current org was created by the current user', function () {
      expect(this.utils.isUserOrgCreator({sys: {id: 1}}, {sys: {createdBy: {sys: {id: 1}}}})).toEqual(true);
    });

    it('should return false if the current org was not created by the current user', function () {
      expect(this.utils.isUserOrgCreator({sys: {id: 1}}, {sys: {createdBy: {sys: {id: 2}}}})).toEqual(false);
    });

    it('should throw if user or org are malformed', function () {
      expect(this.utils.isUserOrgCreator.bind(this.utils)).toThrow();
    });
  });

  describe('#getUserSpaceRoles', function () {
    it('should include "admin" in the array in case of admin', function () {
      const space = {
        spaceMembership: {
          admin: true,
          roles: []
        }
      };
      const roles = this.utils.getUserSpaceRoles(space);
      expect(roles).toContain('admin');
    });

    it('should not include "admin" in the array in case of not admin', function () {
      const space = {
        spaceMembership: {
          admin: false,
          roles: [{ name: 'Some' }]
        }
      };
      const roles = this.utils.getUserSpaceRoles(space);
      expect(roles).toEqual(['some']);
    });

    it('should lowercase roles', function () {
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
