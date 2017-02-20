describe('Snowplow service', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$window = this.$inject('$window');
    this.LazyLoader = this.$inject('LazyLoader');
    this.LazyLoader.get = sinon.stub();
    this.Events = this.$inject('analytics/snowplow/Events');
    this.Events.getSchema = sinon.stub();
    this.Events.transform = sinon.stub();
    this.Snowplow = this.$inject('analytics/snowplow/Snowplow');
    this.getLastEvent = function () {
      return _.last(this.$window.snowplow.q);
    };
  });

  describe('#enable', function () {
    beforeEach(function () {
      this.Snowplow.enable();
    });

    it('creates global `snowplow` object', function () {
      expect(typeof this.$window.snowplow).toBe('object');
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
      const queueSize = this.$window.snowplow.q.length;
      this.Snowplow.track('learn:language_selected');
      expect(this.$window.snowplow.q.length).toBe(queueSize);
    });
  });

  describe('#identify', function () {
    it('adds request to queue', function () {
      this.Snowplow.enable();
      this.Snowplow.identify('user-1');
      expect(this.getLastEvent()[0]).toBe('setUserId');
      expect(this.getLastEvent()[1]).toBe('user-1');
    });
  });

  describe('#track', function () {
    it('sends transformed data to snowplow queue', function () {
      this.Events.transform.returns({
        data: {something: 'someValue'},
        contexts: ['ctx']
      });
      this.Events.getSchema.returns({
        name: 'some_entity_update',
        path: 'main/schema/path'
      });
      this.Snowplow.enable();
      this.Snowplow.track('some_entity:update', {
        actionData: {action: 'update'},
        response: {data: {sys: {id: 'entity-id-1'}}},
        userId: 'user-1',
        spaceId: 's1',
        organizationId: 'org'
      });
      expect(this.getLastEvent()[0]).toBe('trackUnstructEvent');
      expect(this.getLastEvent()[1].schema).toBe('main/schema/path');
      expect(this.getLastEvent()[1].data).toEqual({something: 'someValue'});
      expect(this.getLastEvent()[2]).toEqual(['ctx']);
    });
  });

  describe('#page', function () {
    it('tracks page event', function () {
      const pageData = {
        userId: 'user1',
        spaceId: null,
        organizationId: null,
        state: 'home',
        params: {},
        fromState: 'spaces.detail.entries',
        fromStateParams: {spaceId: 'abc'}
      };
      this.Snowplow.enable();
      this.Snowplow.page(pageData);

      expect(this.getLastEvent()[1].schema).toBe('iglu:com.contentful/page_view/jsonschema/1-0-0');
      expect(this.getLastEvent()[1].data).toEqual({
        executing_user_id: 'user1',
        to_state: 'home',
        to_state_params: {},
        from_state: 'spaces.detail.entries',
        from_state_params: {spaceId: 'abc'}
      });
    });
  });
});
