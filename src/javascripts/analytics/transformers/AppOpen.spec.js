import transformer from './AppOpen';

describe('App open transformer', () => {
  it('transforms data', function () {
    const transformed = transformer('global:app_loaded', {
      userId: 'user-1',
      organizationId: 'org',
      spaceId: 's1',
    });
    expect(transformed.data).toEqual({});
    expect(transformed.contexts[0].schema).toBe('iglu:com.contentful/app/jsonschema/1-0-0');
    expect(transformed.contexts[0].data).toEqual({
      action: 'open',
      executing_user_id: 'user-1',
      organization_id: 'org',
      space_id: 's1',
    });
  });

  it('omits undefined values', function () {
    const transformed = transformer('global:app_loaded', {
      userId: 'user-1',
      organizationId: undefined,
      spaceId: undefined,
    });
    expect(transformed.contexts[0].data).toEqual({
      action: 'open',
      executing_user_id: 'user-1',
    });
  });
});
