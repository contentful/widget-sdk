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

  describe('.canShowIntercomLink$', function () {
    beforeEach(function () {
      this.addOrganizations = function (...organizations) {
        const user = {
          organizationMemberships: []
        };
        organizations.forEach(function (organization) {
          user.organizationMemberships.push({ organization });
        });
        this.TokenStore.user$.set(user);
      };

      this.createOrganization = function (status) {
        return {
          subscription: { status }
        };
      };
    });

    it('hides link when user is loading', function () {
      K.assertCurrentValue(this.view.canShowIntercomLink$, false);
    });

    it('shows when user is member of paid organization', function () {
      this.addOrganizations(this.createOrganization('free'), this.createOrganization('paid'));
      K.assertCurrentValue(this.view.canShowIntercomLink$, true);
    });

    it('shows when user is not a member of paid organization', function () {
      this.addOrganizations(this.createOrganization('free'), this.createOrganization('free'));
      K.assertCurrentValue(this.view.canShowIntercomLink$, false);
    });
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

  describeGoToMethod('goToSubscription', 'subscription');

  describeGoToMethod('goToUsers', 'users.gatekeeper');

  function describeGoToMethod (name, subpage) {
    describe(`.${name}()`, function () {
      const RETURN_VALUE = {};

      beforeEach(function () {
        this.setOrganizationForCurrentSpace({ sys: { id: 'ORG_ID' } });
        this.OrganizationRoles.isOwnerOrAdmin.returns(true);
        this.go.returns(RETURN_VALUE);
        this.returnValue = this.view[name]();
      });

      it(`calls $state.go('${subpage}')`, function () {
        sinon.assert.calledOnce(this.go);
        sinon.assert.calledWithExactly(this.go, `account.organizations.${subpage}`, { orgId: 'ORG_ID' }, { reload: true });
      });

      it('returns .goToOrganizations() returned promise', function () {
        expect(this.returnValue).toBe(RETURN_VALUE);
      });
    });
  }

  describe('getSubScriptionState()', function () {
    beforeEach(function () {
      this.setOrganizationForCurrentSpace({subscriptionState: 'active', sys: {id: 'ORG_0'}});
    });

    it('returns path if user has permission', function () {
      this.OrganizationRoles.isOwnerOrAdmin.returns(true);
      const path = 'account.organizations.subscription({ orgId: \'ORG_0\' })';
      expect(this.view.getSubscriptionState()).toBe(path);
    });

    it('returns undefined if user does not have permission to access path', function () {
      this.OrganizationRoles.isOwnerOrAdmin.returns(false);
      expect(this.view.getSubscriptionState()).toBe(undefined);
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
