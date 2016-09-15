'use strict';

describe('Subscription', function () {
  let moment;

  let ORGANIZATION;

  beforeEach(function () {
    ORGANIZATION = {
      sys: { id: 'SOME_ORG' },
      subscription: {}
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
      describe('isLimitedFree()', function () {
        beforeEach(function () {
          ORGANIZATION.subscription.status = 'free';
        });

        it('returns `false` for trial subscription', function () {
          ORGANIZATION.subscription.status = 'trial';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isLimitedFree()).toBe(false);
        });

        it('returns `true` for limited free subscription', function () {
          ORGANIZATION.subscription.status = 'free';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isLimitedFree()).toBe(true);
        });

        it('returns `false` for paid subscriptions', function () {
          ORGANIZATION.subscription.status = 'paid';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isLimitedFree()).toBe(false);
        });
      });

      describe('.isTrial()', function () {
        it('returns `true` for a trial subscription', function () {
          ORGANIZATION.subscription.status = 'trial';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isTrial()).toBe(true);
        });

        it('returns `false` for limited free subscription', function () {
          ORGANIZATION.subscription.status = 'free';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isTrial()).toBe(false);
        });

        it('returns `false` for paid subscriptions', function () {
          ORGANIZATION.subscription.status = 'paid';
          const subscription = this.newFromOrganization(ORGANIZATION);
          expect(subscription.isTrial()).toBe(false);
        });
      });

      describe('.hasTrialEnded()', function () {
        beforeEach(function () {
          ORGANIZATION.subscription.status = 'trial';
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
          ORGANIZATION.subscription.status = 'trial';
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
    const method = number < 0 ? 'subtract' : 'add';
    return moment()[method](Math.abs(number), timeMeasure).toISOString();
  }
});
