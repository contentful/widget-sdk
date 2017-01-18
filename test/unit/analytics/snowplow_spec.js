describe('Snowplow service', function () {
  beforeEach(function () {
    module('contentful/test');
    this.Snowplow = this.$inject('analytics/Snowplow').default;
    this.$window = this.$inject('$window');
    this.LazyLoader = this.$inject('LazyLoader');
    this.LazyLoader.get = sinon.stub();
    this.Schemas = this.$inject('analytics/SnowplowSchemas').default;
    this.Schemas.get = sinon.stub();
    this.Schemas.isGeneric = sinon.stub();

    this.getLastEvent = function () {
      return _.last(this.$window.snowplow.q);
    };
  });

  describe('#enable', function () {
    beforeEach(function () {
      this.Snowplow.enable();
    });

    it('creates global `snowplow` object', function () {
      expect(typeof this.$window.snowplow).toBe('function');
    });

    it('loads external script', function () {
      sinon.assert.calledWith(this.LazyLoader.get, 'snowplow');
    });

    it('is only run once', function () {
      this.Snowplow.enable();
      sinon.assert.calledOnce(this.LazyLoader.get);
    });
  });

  describe('#disable', function () {
    beforeEach(function () {
      this.Snowplow.enable();
      this.Snowplow.disable();
    });

    it('calling #track does not add event to queue', function () {
      this.Snowplow.track('learn:language_selected');
      expect(this.$window.snowplow.q.length).toBe(1);
    });
  });

  describe('#identify', function () {
    it('adds request to queue', function () {
      this.Snowplow.enable();
      this.Snowplow.identify('user-1');
      expect(this.getLastEvent()).toEqual(jasmine.objectContaining({
        0: 'setUserId', 1: 'user-1'
      }));
    });
  });

  describe('#track', function () {
    beforeEach(function () {
      this.Schemas.get.withArgs('valid:action').returns('schema/path');
      this.Schemas.get.withArgs('invalid:action').returns(undefined);
      this.Snowplow.enable();
    });

    it('tracks event if schema is found', function () {
      this.Schemas.isGeneric.withArgs('valid:action').returns(false);
      this.Snowplow.track('valid:action');
      expect(this.getLastEvent()[0]).toBe('trackUnstructEvent');
      expect(this.getLastEvent()[1].schema).toEqual('schema/path');
      expect(this.getLastEvent()[1].data.action).toBe('action');
    });


    it('does nothing if no schema is found', function () {
      this.Snowplow.track('invalid:action');
      expect(this.getLastEvent()[0]).not.toBe('trackUnstructEvent');
    });

    it('transforms data for generic event', function () {
      this.Schemas.isGeneric.withArgs('valid:action').returns(true);
      this.Snowplow.track('valid:action', {
        userId: 'user-1',
        spaceId: 's1',
        organizationId: 'org',
        foo: 'bar'
      });
      expect(this.getLastEvent()[1].data).toEqual({
        scope: 'valid',
        action: 'action',
        executing_user_id: 'user-1',
        space_id: 's1',
        organization_id: 'org',
        payload: {foo: 'bar'}
      });
    });

    it('transforms data for non-generic event', function () {
      this.Schemas.isGeneric.withArgs('valid:action').returns(false);
      this.Snowplow.track('valid:action', {
        userId: 'user-1',
        spaceId: 's1',
        organizationId: 'org',
        foo: 'bar'
      });
      expect(this.getLastEvent()[1].data).toEqual({
        action: 'action',
        executing_user_id: 'user-1',
        space_id: 's1',
        organization_id: 'org',
        foo: 'bar'
      });
    });
  });
});
