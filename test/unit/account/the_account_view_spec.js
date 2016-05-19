'use strict';

describe('TheAccountView service', function () {
  beforeEach(function () {
    var self = this;

    this.spaceContext = {
      getData: sinon.stub()
    };

    this.OrganizationList = {
      isOwnerOrAdmin: sinon.stub(),
      getAll: sinon.stub()
    };

    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', self.spaceContext);
      $provide.value('OrganizationList', self.OrganizationList);
    });

    this.view = this.$inject('TheAccountView');
    var $state = this.$inject('$state');

    this.go = $state.go = sinon.spy();
  });

  describe('(in)active state', function () {
    it('is inactive by default', function () {
      expect(this.view.isActive()).toBe(false);
    });

    it('marks as active on enter', function () {
      this.view.enter();
      expect(this.view.isActive()).toBe(true);
    });

    it('marks as inactive on exit', function () {
      this.view.enter();
      this.view.exit();
      expect(this.view.isActive()).toBe(false);
    });
  });

  describe('.goToUserProfile()', function () {
    once(function () {
      this.view.goToUserProfile();
    })
    .itGoesTo('the user`s profile', 'profile/user');
  });

  describe('.goToSubscription() and .getGoToSubscriptionOrganization()', function () {
    var orgs = [
      {subscriptionState: 'active', sys: {id: 'ORG_0'}},
      {subscriptionState: 'active', sys: {id: 'ORG_1'}},
      {subscriptionState: 'active', sys: {id: 'ORG_2'}}
    ];

    beforeEach(function () {
      this.OrganizationList.isOwnerOrAdmin.returns(true);
    });

    describe('with at least one space', function () {
      beforeEach(function () {
        this.spaceContext.getData.withArgs('organization').returns(orgs[0]);
      });

      itGoesToTheSubscriptionOf('the next best organization', orgs[0]);

      itRejectsToNavigateNonOrganizationOwners();
    });

    describe('without any space', function () {
      beforeEach(function () {
        this.OrganizationList.getAll.returns(orgs);
      });

      itGoesToTheSubscriptionOf('the next best organization', orgs[0]);

      once(function () {
        this.OrganizationList.isOwnerOrAdmin.withArgs('ORG_1').returns(false);
        orgs[1].subscriptionState = 'trial'; // Trial but not owned.
        orgs[2].subscriptionState = 'trial';
      })
      .itGoesToTheSubscriptionOf('the next best owned trial organization', orgs[2]);

      once(function () {
        this.OrganizationList.isOwnerOrAdmin.withArgs('ORG_0').returns(false);
        orgs[1].subscriptionState = 'inactive';
      })
      .itGoesToTheSubscriptionOf('the next best owned active organization', orgs[2]);

      once(function () {
        this.OrganizationList.isOwnerOrAdmin.withArgs('ORG_0').returns(false);
        this.OrganizationList.isOwnerOrAdmin.withArgs('ORG_2').returns(false);
        orgs[1].subscriptionState = 'inactive';
      })
      .itGoesToTheSubscriptionOf('the next best owned organization', orgs[1]);

      itRejectsToNavigateNonOrganizationOwners();
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
      itGoesToTheSubscriptionOf: itGoesToTheSubscriptionOf
    };

    function itGoesTo (msg, pathSuffix, options) {
      it('navigates to ' + msg, function () {
        setup.call(this);
        sinon.assert.calledOnce(this.go);

        var args = [this.go, 'account.pathSuffix', {pathSuffix: pathSuffix}];
        if (options) {
          args.push(options);
        }
        sinon.assert.calledWith.apply(null, args);
      });
    }

    function itGoesToTheSubscriptionOf (msg, organization) {
      once(function () {
        setup.call(this);
        this.view.goToSubscription();
      })
      .itGoesTo('the subscription of ' + msg,
        'organizations/' + organization.sys.id + '/subscription',
        {reload: true}
      );

      it('returns the organization of' + msg, function () {
        setup.call(this);
        this.view.goToSubscription();
        expect(this.view.getGoToSubscriptionOrganization()).toBe(organization);
      });
    }
  }

  function itGoesToTheSubscriptionOf () {
    once(_.noop).itGoesToTheSubscriptionOf.apply(null, arguments);
  }

  function itRejectsToNavigateNonOrganizationOwners () {
    it('rejects for users who aren`t organization owners', function (done) {
      this.OrganizationList.isOwnerOrAdmin.returns(false);
      this.view.goToSubscription().catch(done);
      this.$inject('$rootScope').$digest();
    });

    it('returns null instead of an organization', function () {
      this.OrganizationList.isOwnerOrAdmin.returns(false);
      expect(this.view.getGoToSubscriptionOrganization()).toBe(null);
    });
  }
});
