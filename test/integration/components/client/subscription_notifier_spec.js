'use strict';

/**
 * @covers dialogsInitController
 * @covers subscriptionNotifier
 * @covers OrganizationRoles
 * @covers Subscription
 */
describe('subscriptionNotifier', () => {
  let broadcastStub, openPaywallStub;

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('paywallOpener', {
        openPaywall: sinon.stub()
      });
    });

    const dialogsInitController = this.$inject('dialogsInitController');
    const moment = this.$inject('moment');
    const OrganizationRoles = this.$inject('services/OrganizationRoles');
    const spaceContext = this.$inject('spaceContext');
    const $rootScope = this.$inject('$rootScope');

    broadcastStub = sinon.stub($rootScope, '$broadcast').returns({});
    openPaywallStub = this.$inject('paywallOpener').openPaywall;

    this.organization = { sys: { id: 42 } };
    const membership = { organization: this.organization };
    OrganizationRoles.setUser({ organizationMemberships: [membership] });
    dialogsInitController.init();

    this.setupOrganization = extension => {
      _.extend(membership.organization, extension);
      spaceContext.space = {
        getId: _.constant('some-space-id')
      };
      spaceContext.organizationContext = { organization: membership.organization };
    };

    this.makeOwner = () => {
      membership.role = 'owner';
    };
    this.makeAdmin = () => {
      membership.role = 'admin';
    };

    this.trialHoursLeft = hours => {
      this.organization.trialPeriodEndsAt = moment()
        .add(hours, 'h')
        .toISOString();
    };
  });

  afterEach(() => {
    broadcastStub.restore();
    broadcastStub = openPaywallStub = null;
  });

  describe('paywall notifier', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date());
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    describe('for a trial subscription', () => {
      beforeEach(function() {
        this.setupOrganization({
          subscription: {
            status: 'trial'
          },
          trialPeriodEndsAt: '2013-12-13T13:28:44Z',
          name: 'TEST_ORGA_NAME'
        });
      });

      describe('already ended', () => {
        beforeEach(function() {
          this.trialHoursLeft(0);
        });

        describe('for user owning the organization', () => {
          beforeEach(function() {
            this.makeOwner();
            this.$apply();
          });

          itOpensPaywallForSettingUpPayment();
        });

        describe('for user not owning the organization', () => {
          beforeEach(function() {
            this.$apply();
          });

          itOpensPaywallToNotifyTheUser();
        });
      });

      describe('ending in less than an hour', () => {
        beforeEach(function() {
          this.trialHoursLeft(0.2);
          this.$apply();
        });

        itDoesNotOpenPaywall();
      });

      describe('ending in less than a day', () => {
        beforeEach(function() {
          this.trialHoursLeft(20);
          this.$apply();
        });

        itDoesNotOpenPaywall();
      });
    });

    describe('for a free subscription', () => {
      beforeEach(function() {
        this.setupOrganization({
          subscription: {
            status: 'free'
          },
          subscriptionPlan: {
            paid: false,
            kind: 'default'
          }
        });
        this.$apply();
      });

      itDoesNotOpenPaywall();
    });
  });

  function itOpensPaywallForSettingUpPayment() {
    itOpensPaywall();

    it('allows setting up payment', () => {
      sinon.assert.calledWith(
        openPaywallStub,
        sinon.match.any,
        sinon.match.has('offerPlanUpgrade', true)
      );
    });
  }

  function itOpensPaywallToNotifyTheUser() {
    itOpensPaywall();

    it('does not allow setting up payment', () => {
      sinon.assert.neverCalledWith(
        openPaywallStub,
        sinon.match.any,
        sinon.match.has('offerPlanUpgrade', true)
      );
    });
  }

  function itOpensPaywall() {
    it('opens the paywall modal dialog for the test organization', function() {
      sinon.assert.calledOnce(openPaywallStub);
      sinon.assert.calledWith(openPaywallStub, this.organization);
    });
  }

  function itDoesNotOpenPaywall() {
    it('does not open the paywall modal dialog', () => {
      sinon.assert.notCalled(openPaywallStub);
    });
  }
});
