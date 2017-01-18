describe('Snowplow schemas service', function () {
  beforeEach(function () {
    module('contentful/test');
    this.Schemas = this.$inject('analytics/SnowplowSchemas').default;
  });

  describe('#get()', function () {
    it('gets generic schema', function () {
      const schema = this.Schemas.get('learn:language_selected');
      expect(schema).toBe('iglu:com.contentful/generic/jsonschema/1-0-0');
    });

    it('gets custom schema', function () {
      const schema = this.Schemas.get('bulk_editor:open');
      expect(schema).toBe('iglu:com.contentful/feature_bulk_editor/jsonschema/1-0-0');
    });

    it('returns undefined if schema is not found', function () {
      const schema = this.Schemas.get('invalid');
      expect(schema).toBeUndefined();
    });
  });

  describe('#isGeneric()', function () {
    it('returns true for generic schema', function () {
      const isGeneric = this.Schemas.isGeneric('learn:language_selected');
      expect(isGeneric).toBe(true);
    });

    it('returns false for custom schema', function () {
      const isGeneric = this.Schemas.isGeneric('bulk_editor:open');
      expect(isGeneric).toBe(false);
    });
  });
});
