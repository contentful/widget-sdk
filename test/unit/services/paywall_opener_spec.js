'use strict';

describe('paywallOpener', function () {
  var self, $q, $rootScope;

  beforeEach(function () {
    this.modalDialog = {
      open: sinon.stub()
    };
    this.analytics = {
      track: sinon.spy()
    };
    this.TheAccountView = {
      goToSubscription: sinon.spy()
    };

    self = this;
    module('contentful/test', function ($provide) {
      $provide.value('modalDialog',    self.modalDialog);
      $provide.value('analytics',      self.analytics);
      $provide.value('TheAccountView', self.TheAccountView);
    });

    $rootScope = this.$inject('$rootScope');
    $q         = this.$inject('$q');

    this.modalDialog.open.returns({promise: $q.defer().promise});
  });

  afterEach(function () {
    self = $q = $rootScope = null;
  });

  describeOpenPaywall('without any options');
  describeOpenPaywall('without plan upgrading option', {offerPlanUpgrade: false});
  describeOpenPaywall('with plan upgrading option', {offerPlanUpgrade: true});

  function describeOpenPaywall(caseMsg, options) {
    describe('.openPaywall() ' + caseMsg, function () {
      testOpenPaywall(options);
    });
  }

  function testOpenPaywall (openPaywallOptions) {
    beforeEach(function () {
      var openPaywall = this.$inject('paywallOpener').openPaywall;
      this.openPaywall = function () {
        openPaywall(this.org, openPaywallOptions);
      };
      this.org = {
        name: 'TEST_ORGANIZATION'
      };
    });

    it('has no return value yet (to be implemented on demand)', function () {
      var ret = this.openPaywall();
      expect(ret).toBe(undefined);
    });

    it('opens a modal dialog', function () {
      this.openPaywall();
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    describe('while open', function () {
      beforeEach(function () {
        this.openPaywall();
      });

      it('does not open more than one dialogs at a time', function () {
        assertCanReopen(false);
      });

      describeNthAnalyticsEvent(0, 'Viewed Paywall');
    });

    describe('when cancelled', function () {
      beforeEach(function () {
        this.modalDialog.open.returns({promise: $q.reject()});
        this.openPaywall();
        $rootScope.$digest();
      });

      it('allows to reopen the paywall', function () {
        assertCanReopen(true);
      });

      describeNthAnalyticsEvent(1, 'Cancelled Paywall');
    });

    describe('when user attempts to set up payment', function () {
      beforeEach(function () {
        this.modalDialog.open.returns({promise: $q.resolve()});
        this.openPaywall();
        var upgrade = this.modalDialog.open.args[0][0].scopeData.setUpPayment;
        upgrade();
        $rootScope.$digest();
      });

      it('allows to reopen the paywall', function () {
        assertCanReopen(true);
      });

      it('redirects the user to the account view', function () {
        sinon.assert.calledOnce(this.TheAccountView.goToSubscription);
      });

      describeNthAnalyticsEvent(1, 'Clicked Paywall Plan Upgrade Button');
    });

    function describeNthAnalyticsEvent(n, event) {
      describe('“' + event + '” analytics event', function () {
        beforeEach(function () {
          this.nthTrack = this.analytics.track.getCall(n);
        });

        it('got tracked', function () {
          expect(this.nthTrack.calledWith(
            event, sinon.match.object)).toBe(true);
        });

        it('received relevant data', function () {
          var canUpgrade = openPaywallOptions && openPaywallOptions.offerPlanUpgrade || false;
          expect(this.nthTrack.args[1]).toEqual({
            userCanUpgradePlan: canUpgrade,
            organizationName: 'TEST_ORGANIZATION'
          });
        });
      });
    }

    function assertCanReopen (canReopen) {
      var initialCallCount = self.modalDialog.open.callCount;
      self.openPaywall();
      sinon.assert.callCount(self.modalDialog.open, initialCallCount + canReopen);
    }
  }

});
