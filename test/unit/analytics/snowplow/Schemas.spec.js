describe('Snowplow schemas service', () => {
  beforeEach(async function() {
    this.getSchema = (await this.system.import('analytics/Schemas')).getSchema;
  });

  describe('#getSchema()', () => {
    it('gets `content_type` schema', function() {
      const schema = this.getSchema('content_type');
      expect(schema.path).toBe('iglu:com.contentful/content_type/jsonschema/1-0-0');
    });

    it('returns undefined if schema is not found', function() {
      const schema = this.getSchema('invalid');
      expect(schema).toBeUndefined();
    });
  });
});
