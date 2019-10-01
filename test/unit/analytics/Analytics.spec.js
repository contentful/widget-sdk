import sinon from 'sinon';
import { $initialize } from 'test/utils/ng';

describe('Analytics', () => {
  const makeMock = keys => keys.reduce((acc, key) => ({ ...acc, [key]: sinon.stub() }), {});

  beforeEach(async function() {
    this.segment = makeMock(['enable', 'disable', 'identify', 'track', 'page']);
    this.Snowplow = makeMock(['enable', 'disable', 'identify', 'track', 'buildUnstructEventData']);

    this.system.set('analytics/segment.es6', {
      default: this.segment
    });
    this.system.set('analytics/snowplow/Snowplow.es6', this.Snowplow);
    this.system.set('analytics/analyticsConsole.es6', makeMock(['setSessionData', 'add']));

    this.analytics = await this.system.import('analytics/Analytics.es6');

    await $initialize(this.system);

    // we want to simulate production environment
    // this way data hits the Segment and Snowplow services
    this.analytics.__testOnlySetEnv('production');

    this.userData = {
      firstName: 'Hans',
      lastName: 'Wurst',
      sys: { id: 'userid' }
    };
  });

  describe('#enable()', () => {
    it('enables Segment and Snowplow', function() {
      this.analytics.enable(this.userData);
      sinon.assert.called(this.segment.enable);
      sinon.assert.called(this.Snowplow.enable);
    });

    it('is executed only once', function() {
      this.analytics.enable(this.userData);
      this.analytics.enable(this.userData);
      sinon.assert.calledOnce(this.segment.enable);
    });
  });

  describe('#disable()', () => {
    it('disables Segment and Snowplow', function() {
      this.analytics.disable();
      sinon.assert.called(this.segment.disable);
      sinon.assert.called(this.Snowplow.disable);
    });

    it('blocks next calls to #enable', function() {
      this.analytics.disable();
      this.analytics.enable({ userData: true });
      sinon.assert.notCalled(this.segment.enable);
      sinon.assert.notCalled(this.Snowplow.enable);
      expect(this.analytics.getSessionData('user')).toBeUndefined();
    });

    it('cleans up session data', function() {
      this.analytics.enable({ test: true });
      expect(this.analytics.getSessionData('user.test')).toBe(true);
      this.analytics.disable();
      expect(this.analytics.getSessionData('user')).toBeUndefined();
    });
  });

  describe('#trackContextChange', function() {
    it('should set the space in the session if given', function() {
      const space = { sys: { id: 'space_1234' } };
      this.analytics.trackContextChange(space);

      expect(this.analytics.getSessionData('space')).toEqual(space);
    });

    it('should set the organization in the session if given', function() {
      const org = { sys: { id: 'org_1234' } };
      this.analytics.trackContextChange(null, org);

      expect(this.analytics.getSessionData('organization')).toEqual(org);
    });

    it('should set both space and org if given', function() {
      const space = { sys: { id: 'space_4567' } };
      const org = { sys: { id: 'org_4567' } };
      this.analytics.trackContextChange(space, org);

      expect(this.analytics.getSessionData('space')).toEqual(space);
      expect(this.analytics.getSessionData('organization')).toEqual(org);
    });

    it('should unset if explicitly called with null value for given param', function() {
      const space = { sys: { id: 'space_4567' } };
      const org = { sys: { id: 'org_4567' } };
      this.analytics.trackContextChange(space, org);

      expect(this.analytics.getSessionData('space')).toEqual(space);
      expect(this.analytics.getSessionData('organization')).toEqual(org);

      this.analytics.trackContextChange(null);
      expect(this.analytics.getSessionData('space')).toBe(null);
      expect(this.analytics.getSessionData('organization')).toEqual(org);

      this.analytics.trackContextChange(space, null);
      expect(this.analytics.getSessionData('space')).toEqual(space);
      expect(this.analytics.getSessionData('organization')).toBe(null);

      this.analytics.trackContextChange(undefined);
      expect(this.analytics.getSessionData('space')).toEqual(space);
    });
  });

  describe('identifying data', () => {
    it('should identify when enabling the service', function() {
      sinon.assert.notCalled(this.segment.identify);
      sinon.assert.notCalled(this.Snowplow.identify);
      this.analytics.enable(this.userData);

      sinon.assert.calledWith(this.segment.identify, 'userid', {
        firstName: 'Hans',
        lastName: 'Wurst'
      });
      sinon.assert.calledWith(this.Snowplow.identify, 'userid');
    });
  });

  describe('tracking events', () => {
    it('calls analytics services if event is valid', function() {
      this.analytics.track('Event', { data: 'foobar' });
      sinon.assert.calledWith(this.segment.track, 'Event', { data: 'foobar' });
      sinon.assert.calledWith(this.Snowplow.track, 'Event', { data: 'foobar' });
    });
  });

  describe('stateActivated', () => {
    const state = { name: 'spaces.detail.entries.detail' };
    const stateParams = { spaceId: 'spaceId', entryId: 'entryId' };

    beforeEach(function() {
      this.analytics.enable(this.userData);
      this.analytics.trackStateChange(state, stateParams);
    });

    it('should set the page in segment', function() {
      sinon.assert.calledWith(this.segment.page, state.name, stateParams);
    });
  });
});
