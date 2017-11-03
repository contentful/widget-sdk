'use strict';

describe('paywallOpener', function () {
  let self, $q, $rootScope;

  beforeEach(function () {
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
    this.LazyLoader = {
      get: sinon.stub().withArgs('gkPlanCardStyles')
    };
    this.TheAccountView = {
      goToSubscription: sinon.spy()
    };

    self = this;
    module('contentful/test', function ($provide) {
      $provide.value('modalDialog', self.modalDialog);
      $provide.value('subscriptionPlanRecommender', subscriptionPlanRecommender);
      $provide.value('analytics/Analytics', self.analytics);
      $provide.value('LazyLoader', self.LazyLoader);
      $provide.value('TheAccountView', self.TheAccountView);
    });

    $rootScope = this.$inject('$rootScope');
    $q = this.$inject('$q');

    this.modalDialog.open.returns({promise: $q.defer().promise});
  });

  afterEach(function () {
    self = $q = $rootScope = null;
  });

  describeOpenPaywall('without any options');

  describeOpenPaywall('without plan upgrading option', {offerPlanUpgrade: false});

  describeOpenPaywall('with plan upgrading option', {offerPlanUpgrade: true}, function () {
    describe('with recommendPlan() failing', function () {
      beforeEach(function () {
        this.recommendPlan.rejects();
      });

      it('opens a modal dialog nonetheless', testOpensPaywallModalDialog);
    });

    describe('with plan cards CSS not being able to load', function () {
      beforeEach(function () {
        this.LazyLoader.get.withArgs('gkPlanCardStyles').rejects();
      });

      it('opens a modal dialog nonetheless', testOpensPaywallModalDialog);
    });
  });

  function describeOpenPaywall (caseMsg, options, moreTests) {
    describe('.openPaywall() ' + caseMsg, function () {
      testOpenPaywall(options, moreTests);
    });
  }

  function testOpenPaywall (openPaywallOptions, moreTests) {
    const userCanUpgrade =
      openPaywallOptions && openPaywallOptions.offerPlanUpgrade || false;

    beforeEach(function () {
      if (userCanUpgrade) {
        this.recommendPlan.resolves({plan: {}, reason: '...'});
        this.LazyLoader.get.withArgs('gkPlanCardStyles').resolves();
      }

      const openPaywall = this.$inject('paywallOpener').openPaywall;
      this.openPaywall = function () {
        openPaywall(this.org, openPaywallOptions);
        $rootScope.$digest();
      };
      this.org = {
        name: 'TEST_ORGANIZATION',
        sys: {id: 'TEST_ID'}
      };
    });

    if (moreTests) {
      moreTests();
    }

    it('has no return value yet (to be implemented on demand)', function () {
      const ret = this.openPaywall();
      expect(ret).toBe(undefined);
    });

    it('opens a modal dialog', testOpensPaywallModalDialog);

    describe('while paywall is open', function () {
      beforeEach(function () {
        this.openPaywall();
      });

      it('does not open more than one dialogs at a time', testCanReopen(false));

      describeNthAnalyticsEvent(0, 'paywall:viewed');
    });

    describe('after paywall got cancelled', function () {
      beforeEach(function () {
        this.modalDialog.open.returns({promise: $q.reject()});
        this.openPaywall();
      });

      it('allows to reopen the paywall', testCanReopen(true));

      describeNthAnalyticsEvent(1, 'paywall:closed');
    });

    describe('after user attempted to set up payment', function () {
      beforeEach(function () {
        this.modalDialog.open.returns({promise: $q.resolve()});
        this.openPaywall();
        const upgrade = this.modalDialog.open.args[0][0].scopeData.setUpPayment;
        upgrade();
        $rootScope.$digest();
      });

      it('allows to reopen the paywall', testCanReopen(true));

      it('redirects the user to the account view', function () {
        sinon.assert.calledOnce(this.TheAccountView.goToSubscription);
      });

      describeNthAnalyticsEvent(1, 'paywall:upgrade_clicked');
    });

    function describeNthAnalyticsEvent (n, event) {
      describe('“' + event + '” analytics event', function () {
        beforeEach(function () {
          this.nthTrack = this.analytics.track.getCall(n);
        });

        it('got tracked', function () {
          expect(this.nthTrack.calledWith(
            event, sinon.match.object)).toBe(true);
        });

        it('received relevant data', function () {
          expect(this.nthTrack.args[1]).toEqual({
            userCanUpgradePlan: userCanUpgrade
          });
        });
      });
    }

    function testCanReopen (canReopen) {
      return function () {
        const initialCallCount = self.modalDialog.open.callCount;
        self.openPaywall();
        sinon.assert.callCount(self.modalDialog.open, initialCallCount + canReopen);
      };
    }
  }

  function testOpensPaywallModalDialog () {
    self.openPaywall();
    sinon.assert.calledOnce(self.modalDialog.open);
  }
});
