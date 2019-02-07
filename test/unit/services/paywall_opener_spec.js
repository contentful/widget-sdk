'use strict';

describe('paywallOpener', () => {
  let self, $q, $rootScope;

  beforeEach(function() {
    this.modalDialog = {
      open: sinon.stub()
    };
    this.recommendPlan = sinon.stub();
    const subscriptionPlanRecommender = {
      recommend: this.recommendPlan
    };
    this.analytics = {
      track: sinon.spy()
    };
    this.TheAccountView = {
      goToSubscription: sinon.spy()
    };

    self = this;
    module('contentful/test', $provide => {
      $provide.constant('modalDialog', self.modalDialog);
      $provide.constant('subscriptionPlanRecommender', subscriptionPlanRecommender);
      $provide.value('analytics/Analytics.es6', self.analytics);
      $provide.constant('TheAccountView', self.TheAccountView);
    });

    $rootScope = this.$inject('$rootScope');
    $q = this.$inject('$q');

    this.modalDialog.open.returns({ promise: $q.defer().promise });
  });

  afterEach(() => {
    self = $q = $rootScope = null;
  });

  describeOpenPaywall('without any options');

  describeOpenPaywall('without plan upgrading option', { offerPlanUpgrade: false });

  describeOpenPaywall('with plan upgrading option', { offerPlanUpgrade: true }, () => {
    describe('with recommendPlan() failing', () => {
      beforeEach(function() {
        this.recommendPlan.rejects();
      });

      it('opens a modal dialog nonetheless', testOpensPaywallModalDialog);
    });
  });

  function describeOpenPaywall(caseMsg, options, moreTests) {
    describe('.openPaywall() ' + caseMsg, () => {
      testOpenPaywall(options, moreTests);
    });
  }

  function testOpenPaywall(openPaywallOptions, moreTests) {
    const userCanUpgrade = (openPaywallOptions && openPaywallOptions.offerPlanUpgrade) || false;

    beforeEach(function() {
      if (userCanUpgrade) {
        this.recommendPlan.resolves({ plan: {}, reason: '...' });
      }

      const openPaywall = this.$inject('paywallOpener').openPaywall;
      this.openPaywall = function() {
        openPaywall(this.org, openPaywallOptions);
        $rootScope.$digest();
      };
      this.org = {
        name: 'TEST_ORGANIZATION',
        sys: { id: 'TEST_ID' }
      };
    });

    if (moreTests) {
      moreTests();
    }

    it('has no return value yet (to be implemented on demand)', function() {
      const ret = this.openPaywall();
      expect(ret).toBe(undefined);
    });

    it('opens a modal dialog', testOpensPaywallModalDialog);

    describe('while paywall is open', () => {
      beforeEach(function() {
        this.openPaywall();
      });

      it('does not open more than one dialogs at a time', testCanReopen(false));

      describeNthAnalyticsEvent(0, 'paywall:viewed');
    });

    describe('after paywall got cancelled', () => {
      beforeEach(function() {
        this.modalDialog.open.returns({ promise: $q.reject() });
        this.openPaywall();
      });

      it('allows to reopen the paywall', testCanReopen(true));

      describeNthAnalyticsEvent(1, 'paywall:closed');
    });

    describe('after user attempted to set up payment', () => {
      beforeEach(function() {
        this.modalDialog.open.returns({ promise: $q.resolve() });
        this.openPaywall();
        const upgrade = this.modalDialog.open.args[0][0].scopeData.setUpPayment;
        upgrade();
        $rootScope.$digest();
      });

      it('allows to reopen the paywall', testCanReopen(true));

      it('redirects the user to the account view', function() {
        sinon.assert.calledOnce(this.TheAccountView.goToSubscription);
      });

      describeNthAnalyticsEvent(1, 'paywall:upgrade_clicked');
    });

    function describeNthAnalyticsEvent(n, event) {
      describe('“' + event + '” analytics event', () => {
        beforeEach(function() {
          this.nthTrack = this.analytics.track.getCall(n);
        });

        it('got tracked', function() {
          expect(this.nthTrack.calledWith(event, sinon.match.object)).toBe(true);
        });

        it('received relevant data', function() {
          expect(this.nthTrack.args[1]).toEqual({
            userCanUpgradePlan: userCanUpgrade
          });
        });
      });
    }

    function testCanReopen(canReopen) {
      return () => {
        const initialCallCount = self.modalDialog.open.callCount;
        self.openPaywall();
        sinon.assert.callCount(self.modalDialog.open, initialCallCount + canReopen);
      };
    }
  }

  function testOpensPaywallModalDialog() {
    self.openPaywall();
    sinon.assert.calledOnce(self.modalDialog.open);
  }
});
