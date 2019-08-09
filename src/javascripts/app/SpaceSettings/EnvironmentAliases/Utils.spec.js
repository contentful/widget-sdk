import { handleOptIn, handleChangeEnvironment } from './Utils.es6';

jest.mock('data/EndpointFactory.es6', () => ({
  createSpaceEndpoint: jest.fn().mockReturnValue(jest.fn().mockImplementation((...res) => res))
}));

describe('Utils', () => {
  it('should opt-in', () => {
    const res = handleOptIn('spaceId', 'newEnvironmentId');
    expect(res).toEqual([
      {
        data: { newEnvironmentId: 'newEnvironmentId' },
        method: 'PUT',
        path: ['optin', 'environment-aliases']
      },
      { 'X-Contentful-Enable-Alpha-Feature': 'environment-aliasing' }
    ]);
  });

  it('should change-endpoint', () => {
    const res = handleChangeEnvironment('spaceId', 'alias', 'aliasedEnvironment');
    expect(res).toEqual([
      {
        data: {
          environment: { sys: { id: 'aliasedEnvironment', linkType: 'Environment', type: 'Link' } }
        },
        method: 'PUT',
        path: ['environment_aliases', 'alias']
      },
      { 'X-Contentful-Enable-Alpha-Feature': 'environment-aliasing' }
    ]);
  });
});
