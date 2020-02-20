import _ from 'lodash';
import sinon from 'sinon';

describe('Snowplow service', () => {
  beforeEach(async function() {
    this.LazyLoader = { get: sinon.stub() };
    this.Events = { getSchemaForEvent: sinon.stub(), transformEvent: sinon.stub() };
    this.window = {};

    this.system.set('utils/LazyLoader', this.LazyLoader);
    this.system.set('analytics/transform', this.Events);

    this.system.set('utils/ngCompat/window', {
      default: this.window
    });

    this.Snowplow = await this.system.import('analytics/snowplow');

    this.getLastEvent = function() {
      return _.last(this.window.snowplow.q);
    };
  });

  describe('#enable', () => {
    beforeEach(function() {
      this.Snowplow.enable();
    });

    it('creates global `snowplow` object', function() {
      expect(typeof this.window.snowplow).toBe('object');
    });

    it('loads external script', function() {
      sinon.assert.calledWith(this.LazyLoader.get, 'snowplow');
    });

    it('is only run once', function() {
      this.Snowplow.enable();
      sinon.assert.calledOnce(this.LazyLoader.get);
    });
  });

  describe('#disable', () => {
    beforeEach(function() {
      this.Snowplow.enable();
      this.Snowplow.disable();
    });

    it('calling #track does not add event to queue', function() {
      const queueSize = this.window.snowplow.q.length;
      this.Snowplow.track('learn:language_selected');
      expect(this.window.snowplow.q.length).toBe(queueSize);
    });
  });

  describe('#identify', () => {
    it('adds request to queue', function() {
      this.Snowplow.enable();
      this.Snowplow.identify('user-1');
      expect(this.getLastEvent()[0]).toBe('setUserId');
      expect(this.getLastEvent()[1]).toBe('user-1');
    });
  });

  describe('#track', () => {
    it('sends data transformed for Snowplow to queue', function() {
      const trackingData = {
        data: {
          actionData: { action: 'update' },
          response: { data: { sys: { id: 'entity-id-1' } } },
          userId: 'user-1',
          spaceId: 's1',
          organizationId: 'org'
        },
        contexts: ['ctx']
      };

      this.Events.getSchemaForEvent.returns({
        name: 'some_entity_update',
        path: 'main/schema/path'
      });
      this.Snowplow.enable();
      this.Snowplow.track('some_entity:update', trackingData);

      expect(this.getLastEvent()[0]).toBe('trackUnstructEvent');
      expect(this.getLastEvent()[1].schema).toBe('main/schema/path');
      expect(this.getLastEvent()[1].data).toEqual(trackingData.data);
      expect(this.getLastEvent()[2]).toEqual(trackingData.contexts);
    });
  });

  describe('#buildUnstructEventData', () => {
    beforeEach(function() {
      this.Events.getSchemaForEvent.returns({
        name: 'xyz',
        path: 'schema/xyz/path'
      });

      this.unstructData = this.Snowplow.buildUnstructEventData('a', {
        data: { key: 'val' },
        contexts: ['ctx']
      });
    });

    it('should return an array', function() {
      expect(Array.isArray(this.unstructData)).toBe(true);
    });

    describe('has following data', () => {
      it('should be an unstructured event', function() {
        expect(this.unstructData[0]).toBe('trackUnstructEvent');
      });

      it('should have an object containing schema url and data', function() {
        expect(this.unstructData[1]).toEqual({
          schema: 'schema/xyz/path',
          data: { key: 'val' }
        });
      });

      it('can have a contexts array if given', function() {
        expect(this.unstructData[2]).toEqual(['ctx']);

        this.unstructData = this.Snowplow.buildUnstructEventData('a', {
          data: { key: 'val' }
        });

        expect(this.unstructData[2]).toEqual(undefined);
      });
    });
  });
});
