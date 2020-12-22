import transformer from './SpaceCreate';

describe('Space create transformer', () => {
  describe('space created from template', () => {
    let transformed;
    beforeEach(function () {
      const eventData = {
        userId: 'user-1',
        organizationId: 'org',
        spaceId: 's1',
        templateName: 'my_template',
      };
      transformed = transformer('space:create', eventData);
    });

    it('data is an empty object', function () {
      expect(transformed.data).toEqual({});
    });

    it('includes space as a context', function () {
      const context = transformed.contexts[0];
      expect(context.schema).toBe('iglu:com.contentful/space/jsonschema/1-0-0');
      expect(context.data).toEqual({
        executing_user_id: 'user-1',
        organization_id: 'org',
        space_id: 's1',
        action: 'create',
      });
    });

    it('includes space template as a context', function () {
      const context = transformed.contexts[1];
      expect(context.schema).toBe('iglu:com.contentful/space_template/jsonschema/1-0-0');
      expect(context.data).toEqual({
        name: 'my_template',
        executing_user_id: 'user-1',
        organization_id: 'org',
        space_id: 's1',
      });
    });
  });

  describe('space created without template', () => {
    it('does not include space as a context', function () {
      const eventData = {
        userId: 'user-1',
        organizationId: 'org',
        spaceId: 's1',
        templateName: undefined,
      };
      const transformed = transformer('space:create', eventData);

      expect(transformed.contexts).toHaveLength(1);
    });
  });
});
