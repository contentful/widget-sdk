import _ from 'lodash';
import transformer from './Generic';

describe('Generic transformer', () => {
  const baseObj = {
    userId: 'user-1',
    organizationId: 'org',
    spaceId: 's1',
  };

  it('transforms data without payload', function () {
    const transformed = transformer('homepage:action!', baseObj);
    expect(transformed.data).toEqual({
      scope: 'homepage',
      action: 'action!',
      executing_user_id: 'user-1',
      organization_id: 'org',
      space_id: 's1',
      payload: {},
    });
    expect(transformed.context).toBeUndefined();
  });

  it('transforms data with payload', function () {
    const additionalFields = { foo: true, bar: 123 };
    const transformed = transformer('homepage:action!', _.extend(additionalFields, baseObj));
    expect(transformed.data).toEqual({
      scope: 'homepage',
      action: 'action!',
      executing_user_id: 'user-1',
      organization_id: 'org',
      space_id: 's1',
      payload: {
        foo: true,
        bar: 123,
      },
    });
  });
});
