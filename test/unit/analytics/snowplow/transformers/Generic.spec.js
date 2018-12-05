import _ from 'lodash';

describe('Generic transformer', () => {
  beforeEach(function() {
    module('contentful/test');
    this.transformer = this.$inject('analytics/snowplow/transformers/Generic.es6').default;
    this.baseObj = {
      userId: 'user-1',
      organizationId: 'org',
      spaceId: 's1'
    };
  });

  it('transforms data without payload', function() {
    const transformed = this.transformer('homepage:action!', this.baseObj);
    expect(transformed.data).toEqual({
      scope: 'homepage',
      action: 'action!',
      executing_user_id: 'user-1',
      organization_id: 'org',
      space_id: 's1',
      payload: {}
    });
    expect(transformed.context).toBeUndefined();
  });

  it('transforms data with payload', function() {
    const additionalFields = { foo: true, bar: 123 };
    const transformed = this.transformer(
      'homepage:action!',
      _.extend(additionalFields, this.baseObj)
    );
    expect(transformed.data).toEqual({
      scope: 'homepage',
      action: 'action!',
      executing_user_id: 'user-1',
      organization_id: 'org',
      space_id: 's1',
      payload: {
        foo: true,
        bar: 123
      }
    });
  });
});
