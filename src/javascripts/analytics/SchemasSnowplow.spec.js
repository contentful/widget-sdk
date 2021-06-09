import { getSnowplowSchema } from './SchemasSnowplow';

describe('Snowplow schemas service', () => {
  describe('#getSnowplowSchema()', () => {
    it('get registered schema', function () {
      const schema = getSnowplowSchema('entry_publish');
      expect(schema.path).toBe('iglu:com.contentful/entry_publish/jsonschema/2-0-2');
    });

    it('returns undefined if schema is not found', function () {
      const schema = getSnowplowSchema('invalid');
      expect(schema).toBeUndefined();
    });
  });
});
