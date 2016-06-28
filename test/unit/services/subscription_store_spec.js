'use strict';

describe('subscriptionStore', function () {
  let moment;

  const UNKNOWN_ORG_ID = 'NO_ORG';
  const ORG_ID = 'SOME_ORG';
  let ORGANIZATION;

  beforeEach(function () {
    ORGANIZATION = {
      sys: { id: ORG_ID },
      subscriptionState: 'active',
      subscriptionPlan: { paid: true }
    };

    this.spaceContext = {};
    this.OrganizationList = {};

    module('contentful/test', ($provide) => {
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('OrganizationList', this.OrganizationList);
    });

    moment = this.$inject('moment');
    this.subscriptionStore = this.$inject('subscriptionStore');
  });

  afterEach(function () {
    moment = ORGANIZATION = null;
  });

  describe('.getCurrent()', function () {
    beforeEach(function () {
      this.spaceContext.getData =
        sinon.stub().withArgs('organization').returns(ORGANIZATION);
    });

    it('returns the current space`s organization`s subscription', function () {
      const subscription = this.subscriptionStore.getCurrent();
      assertSubscriptionMatchesOrg(subscription, ORGANIZATION);
    });
  });

  describe('.get()', function () {
    beforeEach(function () {
      this.OrganizationList.get = sinon.stub();
      this.OrganizationList.get.withArgs(UNKNOWN_ORG_ID).returns(null);
      this.OrganizationList.get.withArgs(ORG_ID).returns(ORGANIZATION);
    });

    it('returns `null` if unknown organization id is given', function () {
      const subscription = this.subscriptionStore.get(UNKNOWN_ORG_ID);
      expect(subscription).toBe(null);
    });

    it('returns the given organization`s subscription', function () {
      const subscription = this.subscriptionStore.get(ORG_ID);
      assertSubscriptionMatchesOrg(subscription, ORGANIZATION);
    });

    describe('returned subscription', function () {
      describe('.state', function () {
        it('is set to its organization`s `subscriptionState`', function () {
          ORGANIZATION.subscriptionState = 'SOME_STATE';
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.state).toBe('SOME_STATE');
        });
      });

      describe('isLimitedFree', function () {
        beforeEach(function () {
          ORGANIZATION.subscriptionState = 'active';
          ORGANIZATION.subscriptionPlan = { paid: false, kind: 'default' };
        });

        it('returns `false` for trial subscription', function () {
          ORGANIZATION.subscriptionState = 'trial';
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.isLimitedFree()).toBe(false);
        });

        it('returns `true` for limited free subscription', function () {
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.isLimitedFree()).toBe(true);
        });

        it('returns `false` for paid subscriptions', function () {
          ORGANIZATION.subscriptionPlan.paid = true;
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.isLimitedFree()).toBe(false);
        });

        it('returns `false` for subscriptions with non-default plan', function () {
          ORGANIZATION.subscriptionPlan.kind = 'not default';
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.isLimitedFree()).toBe(false);
        });
      });

      describe('.isTrial()', function () {
        it('returns `true` for a trial subscription', function () {
          ORGANIZATION.subscriptionState = 'trial';
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.isTrial()).toBe(true);
        });

        it('returns `false` for a non-trial subscription', function () {
          ORGANIZATION.subscriptionState = 'foo';
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.isTrial()).toBe(false);
        });
      });

      describe('.hasTrialEnded()', function () {
        beforeEach(function () {
          ORGANIZATION.subscriptionState = 'trial';
        });

        it('returns `true` if trial has ended', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(-1, 'minute');
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.hasTrialEnded()).toBe(true);
        });

        it('returns `false` if trial has not ended', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(1, 'minute');
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.hasTrialEnded()).toBe(false);
        });

        it('returns `true` if organization has no end date set', function () {
          ORGANIZATION.trialPeriodEndsAt = null;
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.hasTrialEnded()).toBe(true);
        });
      });

      describe('.getTrialHoursLeft()', function () {
        beforeEach(function () {
          ORGANIZATION.subscriptionState = 'trial';
        });

        it('returns 1 hour left', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(90, 'minutes');
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.getTrialHoursLeft()).toBe(1);
        });

        it('returns 0 hours left', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(50, 'minutes');
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.getTrialHoursLeft()).toBe(0);
        });

        it('does not return less than 0 hours left', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(-9, 'hours');
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.getTrialHoursLeft()).toBe(0);
        });

        it('returns 0 hours left if organization has no end date set', function () {
          ORGANIZATION.trialPeriodEndsAt = null;
          const subscription = this.subscriptionStore.get(ORG_ID);
          expect(subscription.getTrialHoursLeft()).toBe(0);
        });
      });
    });
  });

  function assertSubscriptionMatchesOrg (sub, org) {
    expect(sub.organization.sys.id).toBeTruthy();
    expect(sub.organization.sys.id).toBe(org.sys.id);
  }

  function inTime (number, timeMeasure) {
    var method = number < 0 ? 'subtract' : 'add';
    return moment()[method](Math.abs(number), timeMeasure).toISOString();
  }
});
