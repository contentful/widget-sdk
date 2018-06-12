'use strict';

describe('Tracking persistent notification', () => {
  beforeEach(function () {
    module('contentful/test');
    this.analytics = this.$inject('analytics/Analytics');
    sinon.stub(this.analytics, 'track');
    this.trackPersistenNotification = this.$inject('analyticsEvents/persistentNotification');
  });

  describe('without organization data available', () => {
    it('tracks action', function () {
      this.trackPersistenNotification.action('ACTION_NAME');
      sinon.assert.calledWith(this.analytics.track, sinon.match.string, {
        action: 'ACTION_NAME',
        currentPlan: null
      });
    });
  });

  describe('with organization data set', () => {
    it('tracks action and contains current plan name', function () {
      const space = {};
      const planName = 'subscriptionPlanName';
      _.set(space, 'data.organization.subscriptionPlan.name', planName);

      this.analytics.trackSpaceChange(space);
      this.trackPersistenNotification.action('ACTION_NAME');

      sinon.assert.calledWith(this.analytics.track, sinon.match.string, sinon.match({
        action: 'ACTION_NAME',
        currentPlan: planName
      }));
    });
  });
});
