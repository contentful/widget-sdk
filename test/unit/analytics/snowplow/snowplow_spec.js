describe('Snowplow service', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$window = this.$inject('$window');
    this.LazyLoader = this.$inject('LazyLoader');
    this.LazyLoader.get = sinon.stub();
    this.Snowplow = this.$inject('analytics/snowplow/Snowplow').default;
    this.Schemas = this.$inject('analytics/snowplow/Schemas').default;
    this.Schemas.get = sinon.stub();
    this.Schemas.getByEventName = sinon.stub();

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

    it('calling #trackGenericEvent does not add event to queue', function () {
      this.Snowplow.trackGenericEvent('learn:language_selected');
      expect(this.$window.snowplow.q.length).toBe(1);
    });
  });

  describe('#identify', function () {
    it('adds request to queue', function () {
      this.Snowplow.enable();
      this.Snowplow.identify('user-1');
      // TODO: use _.isEqual
      expect(this.getLastEvent()).toEqual(jasmine.objectContaining({
        0: 'setUserId', 1: 'user-1'
      }));
    });
  });

  describe('#trackGenericEvent', function () {
    beforeEach(function () {
      this.Schemas.getByEventName.withArgs('valid:action').returns({path: 'schema/path'});
      this.Schemas.getByEventName.withArgs('invalid:action').returns(undefined);
      this.Snowplow.enable();
    });

    it('tracks event if schema is found', function () {
      this.Snowplow.trackGenericEvent('valid:action');
      expect(this.getLastEvent()[0]).toBe('trackUnstructEvent');
      expect(this.getLastEvent()[1].schema).toEqual('schema/path');
      expect(this.getLastEvent()[1].data.action).toBe('action');
    });


    it('does nothing if no schema is found', function () {
      this.Snowplow.trackGenericEvent('invalid:action');
      expect(this.getLastEvent()[0]).not.toBe('trackUnstructEvent');
    });

    it('transforms data for generic event', function () {
      this.Snowplow.trackGenericEvent('valid:action', {
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
  });

  describe('#trackEntityAction', function () {
    it('transforms data for entity action', function () {
      this.Snowplow.enable();
      this.Schemas.getByEventName.withArgs('some_entity:update').returns({
        name: 'some_entity_update',
        context: 'some_entity',
        path: 'main/schema/path'
      });
      this.Schemas.get.withArgs('some_entity').returns({path: 'context/schema/path'});
      this.Snowplow.trackEntityAction('some_entity:update', {
        actionData: {action: 'update'},
        response: {data: {sys: {id: 'entity-id-1'}}},
        userId: 'user-1',
        spaceId: 's1',
        organizationId: 'org'
      });

      expect(this.getLastEvent()[1].schema).toBe('main/schema/path');

      expect(_.isEqual(this.getLastEvent()[2][0], {
        schema: 'context/schema/path',
        data: {
          action: 'update',
          executing_user_id: 'user-1',
          space_id: 's1',
          organization_id: 'org',
          some_entity_id: 'entity-id-1'
        }
      })).toBe(true);
    });
  });
});
