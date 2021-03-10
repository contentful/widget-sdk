import { getSnowplowSchema } from './SchemasSnowplow';

describe('Snowplow schemas service', () => {
  describe('#getSnowplowSchema()', () => {
    it('gets `content_type` schema', function () {
      const schema = getSnowplowSchema('content_type');
      expect(schema.path).toBe('iglu:com.contentful/content_type/jsonschema/1-0-0');
    });

    it('returns undefined if schema is not found', function () {
      const schema = getSnowplowSchema('invalid');
      expect(schema).toBeUndefined();
    });
  });
});
