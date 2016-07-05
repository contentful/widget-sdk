'use strict';

describe('Subscription', function () {
  let moment;

  let ORGANIZATION;

  beforeEach(function () {
    ORGANIZATION = {
      sys: { id: 'SOME_ORG' },
      subscriptionState: 'active',
      subscriptionPlan: { paid: true }
    };

    module('contentful/test');

    moment = this.$inject('moment');
    this.newFromOrganization = this.$inject('Subscription').newFromOrganization;
  });

  afterEach(function () {
    moment = ORGANIZATION = null;
  });

  describe('.newFromOrganization()', function () {
    it('returns the given organization`s subscription', function () {
      const subscription = this.newFromOrganization(ORGANIZATION);
      assertSubscriptionMatchesOrg(subscription, ORGANIZATION);
    });

    describe('returned subscription', function () {
      describe('.state', function () {
        it('is set to its organization`s `subscriptionState`', function () {
          ORGANIZATION.subscriptionState = 'SOME_STATE';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.state).toBe('SOME_STATE');
        });
      });

      describe('isLimitedFree()', function () {
        beforeEach(function () {
          ORGANIZATION.subscriptionState = 'active';
          ORGANIZATION.subscriptionPlan = { paid: false, kind: 'default' };
        });

        it('returns `false` for trial subscription', function () {
          ORGANIZATION.subscriptionState = 'trial';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isLimitedFree()).toBe(false);
        });

        it('returns `true` for limited free subscription', function () {
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isLimitedFree()).toBe(true);
        });

        it('returns `false` for paid subscriptions', function () {
          ORGANIZATION.subscriptionPlan.paid = true;
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isLimitedFree()).toBe(false);
        });

        it('returns `false` for subscriptions with non-default plan', function () {
          ORGANIZATION.subscriptionPlan.kind = 'not default';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isLimitedFree()).toBe(false);
        });
      });

      describe('.isTrial()', function () {
        it('returns `true` for a trial subscription', function () {
          ORGANIZATION.subscriptionState = 'trial';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isTrial()).toBe(true);
        });

        it('returns `false` for a non-trial subscription', function () {
          ORGANIZATION.subscriptionState = 'foo';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isTrial()).toBe(false);
        });
      });

      describe('.hasTrialEnded()', function () {
        beforeEach(function () {
          ORGANIZATION.subscriptionState = 'trial';
        });

        it('returns `true` if trial has ended', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(-1, 'minute');
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.hasTrialEnded()).toBe(true);
        });

        it('returns `false` if trial has not ended', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(1, 'minute');
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.hasTrialEnded()).toBe(false);
        });

        it('returns `true` if organization has no end date set', function () {
          ORGANIZATION.trialPeriodEndsAt = null;
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.hasTrialEnded()).toBe(true);
        });
      });

      describe('.getTrialHoursLeft()', function () {
        beforeEach(function () {
          ORGANIZATION.subscriptionState = 'trial';
        });

        it('returns 1 hour left', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(90, 'minutes');
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.getTrialHoursLeft()).toBe(1);
        });

        it('returns 0 hours left', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(50, 'minutes');
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.getTrialHoursLeft()).toBe(0);
        });

        it('does not return less than 0 hours left', function () {
          ORGANIZATION.trialPeriodEndsAt = inTime(-9, 'hours');
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.getTrialHoursLeft()).toBe(0);
        });

        it('returns 0 hours left if organization has no end date set', function () {
          ORGANIZATION.trialPeriodEndsAt = null;
          const subscription = this.newFromOrganization(ORGANIZATION);
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
