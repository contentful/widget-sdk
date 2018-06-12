describe('Space create transformer', () => {
  beforeEach(function () {
    module('contentful/test');
    this.transformer = this.$inject('analytics/snowplow/transformers/SpaceCreate').default;
  });

  describe('space created from template', () => {
    beforeEach(function () {
      const eventData = {
        userId: 'user-1',
        organizationId: 'org',
        spaceId: 's1',
        templateName: 'my_template'
      };
      this.transformed = this.transformer('space:create', eventData);
    });

    it('data is an empty object', function () {
      expect(this.transformed.data).toEqual({});
    });

    it('includes space as a context', function () {
      const context = this.transformed.contexts[0];
      expect(context.schema).toBe('iglu:com.contentful/space/jsonschema/1-0-0');
      expect(context.data).toEqual({
        'executing_user_id': 'user-1',
        'organization_id': 'org',
        'space_id': 's1',
        'action': 'create'
      });
    });

    it('includes space template as a context', function () {
      const context = this.transformed.contexts[1];
      expect(context.schema).toBe('iglu:com.contentful/space_template/jsonschema/1-0-0');
      expect(context.data).toEqual({
        'name': 'my_template',
        'executing_user_id': 'user-1',
        'organization_id': 'org',
        'space_id': 's1'
      });
    });
  });

  describe('space created without template', () => {
    beforeEach(function () {
      const eventData = {
        userId: 'user-1',
        organizationId: 'org',
        spaceId: 's1',
        templateName: undefined
      };
      this.transformed = this.transformer('space:create', eventData);
    });

    it('does not include space as a context', function () {
      expect(this.transformed.contexts.length).toBe(1);
    });
  });
});
