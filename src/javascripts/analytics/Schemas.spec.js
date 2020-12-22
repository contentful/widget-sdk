import { getSchema } from './Schemas';

describe('Snowplow schemas service', () => {
  describe('#getSchema()', () => {
    it('gets `content_type` schema', function () {
      const schema = getSchema('content_type');
      expect(schema.path).toBe('iglu:com.contentful/content_type/jsonschema/1-0-0');
    });

    it('returns undefined if schema is not found', function () {
      const schema = getSchema('invalid');
      expect(schema).toBeUndefined();
    });
  });
});
