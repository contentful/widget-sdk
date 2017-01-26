'use strict';

describe('analytics', function () {
  beforeEach(function () {
    module('contentful/test');

    // we want to simulate production environment
    // this way data hits the Segment and Snowplow services
    const environment = this.$inject('environment');
    const originalEnv = environment.env;
    environment.env = 'production';
    this.restoreEnv = () => { environment.env = originalEnv; };

    this.analytics = this.$inject('analytics');

    this.segment = this.$inject('analytics/segment');
    ['enable', 'disable', 'identify', 'track', 'page'].forEach((m) => {
      sinon.stub(this.segment, m);
    });

    this.Snowplow = this.$inject('analytics/snowplow/Snowplow').default;
    ['enable', 'disable', 'identify', 'trackGenericEvent', 'trackEntityAction'].forEach((m) => {
      sinon.stub(this.Snowplow, m);
    });

    this.Schemas = this.$inject('analytics/snowplow/Schemas').default;

    this.userData = {
      firstName: 'Hans',
      lastName: 'Wurst',
      sys: {id: 'userid'}
    };
  });

  afterEach(function () {
    this.restoreEnv();
  });

  describe('#enable()', function () {
    it('enables Segment and Snowplow', function () {
      this.analytics.enable(this.userData);
      sinon.assert.called(this.segment.enable);
      sinon.assert.called(this.Snowplow.enable);
    });

    it('is executed only once', function () {
      this.analytics.enable(this.userData);
      this.analytics.enable(this.userData);
      sinon.assert.calledOnce(this.segment.enable);
    });
  });

  describe('#disable()', function () {
    it('disables Segment and Snowplow', function () {
      this.analytics.disable();
      sinon.assert.called(this.segment.disable);
      sinon.assert.called(this.Snowplow.disable);
    });

    it('blocks next calls to #enable', function () {
      this.analytics.disable();
      this.analytics.enable({userData: true});
      sinon.assert.notCalled(this.segment.enable);
      sinon.assert.notCalled(this.Snowplow.enable);
      expect(this.analytics.getSessionData('user')).toBeUndefined();
    });

    it('cleans up session data', function () {
      this.analytics.enable({test: true});
      expect(this.analytics.getSessionData('user.test')).toBe(true);
      this.analytics.disable();
      expect(this.analytics.getSessionData()).toEqual({});
    });
  });

  describe('identifying data', function () {
    it('should identify when enabling the service', function () {
      sinon.assert.notCalled(this.segment.identify);
      sinon.assert.notCalled(this.Snowplow.identify);
      this.analytics.enable(this.userData);
      sinon.assert.calledWith(this.segment.identify, 'userid', this.userData);
      sinon.assert.calledWith(this.Snowplow.identify, 'userid');
    });
  });

  it('should track', function () {
    this.analytics.track('Event', {data: 'foobar'});
    sinon.assert.calledWith(this.segment.track, 'Event', {data: 'foobar'});
    sinon.assert.calledWith(this.Snowplow.trackGenericEvent, 'Event', {data: 'foobar'});
  });

  describe('stateActivated', function () {
    const state = {name: 'spaces.detail.entries.detail'};
    const stateParams = {spaceId: 'spaceId', entryId: 'entryId'};

    beforeEach(function () {
      this.analytics.enable(this.userData);
      this.analytics.trackStateChange(state, stateParams);
    });

    it('should set the page in segment', function () {
      sinon.assert.calledWith(this.segment.page, state.name, stateParams);
    });

    it('should track segment', function () {
      sinon.assert.called(this.segment.track);
    });
  });

  describe('trackEntityAction', function () {
    it('calls Snowplow method if schema is found', function () {
      this.Schemas.getByEventName = sinon.stub().returns({});
      this.analytics.trackEntityAction('action');
      sinon.assert.calledWith(this.Snowplow.trackEntityAction, 'action', {});
    });

    it('does not call Snowplow method if no schema is found', function () {
      this.Schemas.getByEventName = sinon.stub().returns();
      this.analytics.trackEntityAction('event');
      sinon.assert.notCalled(this.Snowplow.trackEntityAction);
    });
  });
});
