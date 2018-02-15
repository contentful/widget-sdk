import * as K from 'helpers/mocks/kefir';
import * as sinon from 'helpers/sinon';

describe('TheAccountView service', function () {
  beforeEach(function () {
    this.spaceContext = {
      getData: sinon.stub()
    };
    this.setOrganizationForCurrentSpace = function (org) {
      this.spaceContext.getData.withArgs('organization').returns(org);
    };

    this.OrganizationRoles = {
      isOwnerOrAdmin: sinon.stub()
    };

    module('contentful/test', ($provide) => {
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('services/OrganizationRoles', this.OrganizationRoles);
    });

    this.TokenStore = this.mockService('services/TokenStore', {
      user$: K.createMockProperty(null),
      organizations$: K.createMockProperty([])
    });

    this.view = this.$inject('TheAccountView');
    const $state = this.$inject('$state');

    this.go = $state.go = sinon.stub();
  });

  describe('#getOrganizationRef()', function () {
    const ORGS = [
      {subscriptionState: 'active', sys: {id: 'ORG_0'}},
      {subscriptionState: 'active', sys: {id: 'ORG_1'}},
      {subscriptionState: 'active', sys: {id: 'ORG_2'}}
    ];

    beforeEach(function () {
      this.OrganizationRoles.isOwnerOrAdmin.returns(true);
    });

    it('returns undefined when user is not an admin', function () {
      this.OrganizationRoles.isOwnerOrAdmin.returns(false);
      expect(this.view.getOrganizationRef()).toBe(null);
    });

    describe('with at least one space', function () {
      beforeEach(function () {
        this.setOrganizationForCurrentSpace(ORGS[0]);
      });

      it('references space organization main page', function () {
        const ref = this.view.getOrganizationRef();
        assertOrgRef(ref, ORGS[0], 'subscription');
      });

      it('references space organization subpage', function () {
        const ref = this.view.getOrganizationRef('foo');
        assertOrgRef(ref, ORGS[0], 'foo');
      });
    });

    describe('without any space', function () {
      beforeEach(function () {
        this.TokenStore.organizations$.set(ORGS);
      });

      it('references the next best organization', function () {
        const ref = this.view.getOrganizationRef('foo');
        assertOrgRef(ref, ORGS[0], 'foo');
      });

      it('references the next best owned trial organization', function () {
        this.OrganizationRoles.isOwnerOrAdmin.withArgs(ORGS[1]).returns(false);
        ORGS[1].subscriptionState = 'trial'; // Trial but not owned.
        ORGS[2].subscriptionState = 'trial';

        const ref = this.view.getOrganizationRef('foo');
        assertOrgRef(ref, ORGS[2], 'foo');
      });

      it('references the next best owned active organization', function () {
        this.OrganizationRoles.isOwnerOrAdmin.withArgs(ORGS[0]).returns(false);
        ORGS[1].subscriptionState = 'inactive';

        const ref = this.view.getOrganizationRef('foo');
        assertOrgRef(ref, ORGS[2], 'foo');
      });

      it('references the next best owned organization', function () {
        this.OrganizationRoles.isOwnerOrAdmin.withArgs(ORGS[0]).returns(false);
        this.OrganizationRoles.isOwnerOrAdmin.withArgs(ORGS[2]).returns(false);
        ORGS[1].subscriptionState = 'inactive';

        const ref = this.view.getOrganizationRef('foo');
        assertOrgRef(ref, ORGS[1], 'foo');
      });
    });
  });

  const pricingV1Org = { sys: { id: 'ORG_ID' } };
  const pricingV2Org = { sys: { id: 'ORG_ID' }, pricingVersion: 'pricing_version_2' };

  describeGoToMethod('goToSubscription', 'subscription', pricingV1Org, 'pricing v1 org');
  describeGoToMethod('goToSubscription', 'subscription_new', pricingV2Org, 'pricing v2 org');

  describeGoToMethod('goToUsers', 'users.gatekeeper', pricingV1Org);

  function describeGoToMethod (name, subpage, org, comment = '') {
    describe(`.${name}()${comment && ', ' + comment}`, function () {
      const RETURN_VALUE = {};

      beforeEach(function () {
        this.setOrganizationForCurrentSpace(org);
        this.OrganizationRoles.isOwnerOrAdmin.returns(true);
        this.go.returns(RETURN_VALUE);
        this.returnValue = this.view[name]();
      });

      it(`calls $state.go('${subpage}')`, function () {
        sinon.assert.calledOnce(this.go);
        sinon.assert.calledWithExactly(this.go, `account.organizations.${subpage}`, { orgId: org.sys.id }, { reload: true });
      });

      it('returns .goToOrganizations() returned promise', function () {
        expect(this.returnValue).toBe(RETURN_VALUE);
      });
    });
  }

  describe('getSubscriptionState()', function () {
    it('returns state object for v1 org if user has permission', function () {
      this.setOrganizationForCurrentSpace(pricingV1Org);
      this.OrganizationRoles.isOwnerOrAdmin.returns(true);
      const sref = {
        path: ['account', 'organizations', 'subscription'],
        params: { orgId: 'ORG_ID' },
        options: { reload: true }
      };
      expect(this.view.getSubscriptionState()).toEqual(sref);
    });

    it('returns null for v1 and v2 orgs if user does not have access permission', function () {
      this.OrganizationRoles.isOwnerOrAdmin.returns(false);
      this.setOrganizationForCurrentSpace(pricingV1Org);
      expect(this.view.getSubscriptionState()).toBe(null);
      this.setOrganizationForCurrentSpace(pricingV2Org);
      expect(this.view.getSubscriptionState()).toBe(null);
    });

    it('returns null if no org in space context', function () {
      this.setOrganizationForCurrentSpace(null);
      this.OrganizationRoles.isOwnerOrAdmin.returns(true);
      expect(this.view.getSubscriptionState()).toBe(null);
    });

    it('has path to new subscription page for v2 org', function () {
      this.setOrganizationForCurrentSpace(pricingV2Org);
      this.OrganizationRoles.isOwnerOrAdmin.returns(true);
      const sref = {
        path: ['account', 'organizations', 'subscription_new'],
        params: { orgId: 'ORG_ID' },
        options: { reload: true }
      };
      expect(this.view.getSubscriptionState()).toEqual(sref);
    });
  });

  function assertOrgRef (ref, org, subpage) {
    expect(ref).toEqual({
      path: ['account', 'organizations', subpage],
      params: {
        orgId: org.sys.id
      },
      options: { reload: true }
    });
  }
});
