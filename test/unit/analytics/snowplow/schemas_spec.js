describe('Snowplow schemas service', function () {
  beforeEach(function () {
    module('contentful/test');
    this.Schemas = this.$inject('analytics/snowplow/Schemas').default;
  });

  describe('#get()', function () {
    it('gets `generic` schema', function () {
      const schema = this.Schemas.get('generic');
      expect(schema.path).toBe('iglu:com.contentful/generic/jsonschema/1-0-0');
    });

    it('gets `content_type_create` schema', function () {
      const schema = this.Schemas.get('content_type_create');
      expect(schema.context).toBe('content_type');
      expect(schema.path).toBe('iglu:com.contentful/content_type_create/jsonschema/1-0-0');
    });

    it('gets linked context schema', function () {
      const schema = this.Schemas.get('content_type');
      expect(schema.path).toBe('iglu:com.contentful/content_type/jsonschema/1-0-0');
    });

    it('returns undefined if schema is not found', function () {
      const schema = this.Schemas.get('invalid');
      expect(schema).toBeUndefined();
    });
  });

  describe('#getByEventName()', function () {
    it('gets schema for a generic event', function () {
      const schema = this.Schemas.getByEventName('learn:language_selected');
      expect(schema.path).toBe('iglu:com.contentful/generic/jsonschema/1-0-0');
    });

    it('returns undefined if event name is not found', function () {
      const schema = this.Schemas.getByEventName('invalid');
      expect(schema).toBe(undefined);
    });
  });
});
