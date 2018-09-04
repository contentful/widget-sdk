'use strict';

describe('Tracking persistent notification', () => {
  beforeEach(function() {
    module('contentful/test');
    this.analytics = this.$inject('analytics/Analytics.es6');
    sinon.stub(this.analytics, 'track');
    this.trackPersistenNotification = this.$inject('analyticsEvents/persistentNotification');
  });

  describe('without organization data available', () => {
    it('tracks action', function() {
      this.trackPersistenNotification.action('ACTION_NAME');
      sinon.assert.calledWith(this.analytics.track, sinon.match.string, {
        action: 'ACTION_NAME',
        currentPlan: null
      });
    });
  });

  describe('with organization data set', () => {
    it('tracks action and contains current plan name', function() {
      const org = {};
      const planName = 'subscriptionPlanName';
      _.set(org, 'subscriptionPlan.name', planName);

      this.analytics.trackContextChange(null, org);
      this.trackPersistenNotification.action('ACTION_NAME');

      sinon.assert.calledWith(
        this.analytics.track,
        sinon.match.string,
        sinon.match({
          action: 'ACTION_NAME',
          currentPlan: planName
        })
      );
    });
  });
});
