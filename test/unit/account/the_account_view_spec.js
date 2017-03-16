import * as K from 'helpers/mocks/kefir';

describe('TheAccountView service', function () {
  beforeEach(function () {
    this.spaceContext = {
      getData: sinon.stub()
    };

    this.OrganizationList = {
      isOwnerOrAdmin: sinon.stub(),
      getAll: sinon.stub()
    };

    module('contentful/test', ($provide) => {
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('OrganizationList', this.OrganizationList);
    });

    this.tokenStore = this.mockService('tokenStore', {
      user$: K.createMockProperty(null)
    });

    this.view = this.$inject('TheAccountView');
    const $state = this.$inject('$state');

    this.go = $state.go = sinon.spy();
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
        this.tokenStore.user$.set(user);
      };

      this.createOrganization = function (status) {
        return {
          subscription: { status }
        };
      };
    });

    it('hides link when user is loading', function () {
      expect(K.getValue(this.view.canShowIntercomLink$)).toEqual(false);
    });

    it('shows when user is member of paid organization', function () {
      this.addOrganizations(this.createOrganization('free'), this.createOrganization('paid'));
      expect(K.getValue(this.view.canShowIntercomLink$)).toEqual(true);
    });

    it('shows when user is not a member of paid organization', function () {
      this.addOrganizations(this.createOrganization('free'), this.createOrganization('free'));
      expect(K.getValue(this.view.canShowIntercomLink$)).toEqual(false);
    });
  });

  describe('.goToUserProfile()', function () {
    once(function () {
      this.view.goToUserProfile();
    })
    .itGoesTo('the user`s profile', 'profile/user');
  });

  describe('.goToOrganizations() and .canGoToOrganizations()', function () {
    const ORGS = [
      {subscriptionState: 'active', sys: {id: 'ORG_0'}},
      {subscriptionState: 'active', sys: {id: 'ORG_1'}},
      {subscriptionState: 'active', sys: {id: 'ORG_2'}}
    ];

    beforeEach(function () {
      this.OrganizationList.isOwnerOrAdmin.returns(true);
    });

    describe('with at least one space', function () {
      beforeEach(function () {
        this.spaceContext.getData.withArgs('organization').returns(ORGS[0]);
      });

      itGoesToTheOrganizationOf('the next best organization', ORGS[0]);

      itRejectsToNavigateNonOrganizationOwnersOrAdmins();
    });

    describe('without any space', function () {
      beforeEach(function () {
        this.OrganizationList.getAll.returns(ORGS);
      });

      itGoesToTheOrganizationOf('the next best organization', ORGS[0]);

      once(function () {
        this.OrganizationList.isOwnerOrAdmin.withArgs(ORGS[1]).returns(false);
        ORGS[1].subscriptionState = 'trial'; // Trial but not owned.
        ORGS[2].subscriptionState = 'trial';
      })
      .itGoesToTheOrganizationOf('the next best owned trial organization', ORGS[2]);

      once(function () {
        this.OrganizationList.isOwnerOrAdmin.withArgs(ORGS[0]).returns(false);
        ORGS[1].subscriptionState = 'inactive';
      })
      .itGoesToTheOrganizationOf('the next best owned active organization', ORGS[2]);

      once(function () {
        this.OrganizationList.isOwnerOrAdmin.withArgs(ORGS[0]).returns(false);
        this.OrganizationList.isOwnerOrAdmin.withArgs(ORGS[2]).returns(false);
        ORGS[1].subscriptionState = 'inactive';
      })
      .itGoesToTheOrganizationOf('the next best owned organization', ORGS[1]);

      itRejectsToNavigateNonOrganizationOwnersOrAdmins();
    });
  });

  describeGoToMethod('goToBilling', 'z_billing');

  describeGoToMethod('goToSubscription', 'z_subscription');

  function describeGoToMethod (name, subpage) {
    describe(`.${name}()`, function () {
      const RETURN_VALUE = {};

      beforeEach(function () {
        this.view.goToOrganizations = sinon.stub().returns(RETURN_VALUE);
        this.returnValue = this.view[name]();
      });

      it(`calls .goToOrganizations('${subpage}')`, function () {
        sinon.assert.calledOnce(this.view.goToOrganizations);
        sinon.assert.calledWithExactly(this.view.goToOrganizations, subpage);
      });

      it('returns .goToOrganizations() returned promise', function () {
        expect(this.returnValue).toBe(RETURN_VALUE);
      });
    });
  }

  describe('getSubScriptionState()', function () {
    beforeEach(function () {
      this.org = {subscriptionState: 'active', sys: {id: 'ORG_0'}};
      this.spaceContext.getData.withArgs('organization').returns(this.org);
    });

    it('returns path if user has permission', function () {
      this.OrganizationList.isOwnerOrAdmin.returns(true);
      const path = 'account.pathSuffix({ pathSuffix: \'organizations/ORG_0/subscription\'})';
      expect(this.view.getSubscriptionState()).toBe(path);
    });

    it('returns undefined if user does not have permission to access path', function () {
      this.OrganizationList.isOwnerOrAdmin.returns(false);
      expect(this.view.getSubscriptionState()).toBe(undefined);
    });
  });

  describe('silentlyChangeState()', function () {
    once(function () {
      this.view.silentlyChangeState('x/y');
    })
    .itGoesTo('given location', 'x/y', {location: 'replace'});
  });

  function once (setup) {
    return {
      itGoesTo: itGoesTo,
      itGoesToTheOrganizationOf: itGoesToTheOrganizationOf
    };

    function itGoesTo (msg, pathSuffix, options) {
      it(`navigates to ${msg}`, function () {
        setup.call(this);
        sinon.assert.calledOnce(this.go);

        const args = [this.go, 'account.pathSuffix', {pathSuffix: pathSuffix}];
        if (options) {
          args.push(options);
        }
        sinon.assert.calledWith.apply(null, args);
      });
    }

    function itGoesToTheOrganizationOf (msg, organization) {
      describe('navigating to organization (default)', () => test());

      describe('navigating to organization (particular subpage)', () => test('foo'));

      it(`returns true since user can navigate to ${msg}`, function () {
        setup.call(this);
        this.view.goToOrganizations();
        expect(this.view.canGoToOrganizations()).toBe(true);
      });

      function test (subpageParam) {
        const expectedPathSuffix = subpageParam || 'z_subscription';
        once(function () {
          setup.call(this);
          this.view.goToOrganizations(subpageParam);
        })
        .itGoesTo(`the organization (subscription) of ${msg}`,
          `organizations/${organization.sys.id}/` + expectedPathSuffix,
          {reload: true}
        );
      }
    }
  }

  function itGoesToTheOrganizationOf () {
    once(_.noop).itGoesToTheOrganizationOf.apply(null, arguments);
  }

  function itRejectsToNavigateNonOrganizationOwnersOrAdmins () {
    const msg = 'for users who are not organization owners or admins';

    it(`rejects ${msg}`, function* () {
      this.OrganizationList.isOwnerOrAdmin.returns(false);
      yield this.catchPromise(this.view.goToOrganizations());
      this.$inject('$rootScope').$digest();
    });

    it(`returns false for ${msg}`, function () {
      this.OrganizationList.isOwnerOrAdmin.returns(false);
      expect(this.view.canGoToOrganizations()).toBe(false);
    });
  }
});
