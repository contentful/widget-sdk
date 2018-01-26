const PATH = 'analytics/snowplow/transformers/EntryActionV2';

describe(PATH, function () {
  const BASE_EVENT = { data: {}, contexts: [ { data: 1 }, { bar: 2 } ] };

  beforeEach(function () {
    module('contentful/test', ($provide) => {
      const EntityAction = sinon.stub().returns();
      $provide.value('analytics/snowplow/transformers/EntityAction', EntityAction);
    });
    this.transform = this.$inject(PATH).default;
  });

  it('contains `EntityAction` `contexts`', function () {
    const entityData = {
      actionData: {
        entity: 'ContentType',
        action: 'create'
      },
      response: {
        data: {sys: {id: 'ct1', version: 2}}
      },
      userId: 'u1',
      spaceId: 's1',
      organizationId: 'o1'
    };

    const transformed = this.transformer('e1', entityData);
    expect(transformed.data).toEqual({});
    expect(transformed.contexts).toEqual([{
      schema: 'iglu:com.contentful/content_type/jsonschema/1-0-0',
      data: {
        action: 'create',
        executing_user_id: 'u1',
        organization_id: 'o1',
        space_id: 's1',
        version: 2,
        content_type_id: 'ct1'
      }
    }]);
  });

  it('adds additional fields for `entry_create`', function () {
    const entityData = {
      actionData: {entity: 'Entry', action: 'create'},
      response: {data: {
        sys: {
          id: 'e1',
          version: 3,
          revision: 0,
          contentType: {sys: {id: 'ct2'}}
        }
      }},
      userId: 'u1',
      spaceId: 's1',
      organizationId: 'o1'
    };
    const transformed = this.transformer('e1', entityData);
    expect(transformed.contexts[0].data.revision).toBe(0);
    expect(transformed.contexts[0].data.content_type_id).toBe('ct2');
  });
});
