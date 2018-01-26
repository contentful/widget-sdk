const PATH = 'analytics/snowplow/transformers/EntryActionV2';

describe(PATH, function () {
  const BASE_EVENT = { data: {}, contexts: [ { data: 1 }, { bar: 2 } ] };

  beforeEach(function () {
    module('contentful/test', ($provide) => {
      this.EntityActionStub = sinon.stub();
      $provide.value('analytics/snowplow/transformers/EntityAction', this.EntityActionStub);
    });
    this.transform = this.$inject(PATH).default;
  });

  it('adds `EntityAction`\'s `contexts`', function () {
    const eventData = {};

    this.EntityActionStub.withArgs('e1', eventData).returns(BASE_EVENT);

    const transformed = this.transform('e1', eventData);

    expect(transformed.contexts).toEqual(BASE_EVENT.contexts);
  });

  it('contains base data ', function () {
    this.EntityActionStub.returns({});

    const eventData = {
      userId: 'USER_ID',
      organizationId: 'ORGANIZATION_ID',
      spaceId: 'SPACE_ID'
    };
    const transformed = this.transform('e1', eventData);

    expect(transformed.data).toEqual({
      'executing_user_id': eventData.userId,
      'organization_id': eventData.organizationId,
      'space_id': eventData.spaceId
    });
  });
});
