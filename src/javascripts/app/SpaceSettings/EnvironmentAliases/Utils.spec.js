import { handleOptIn, handleChangeEnvironment } from './Utils';

jest.mock('data/EndpointFactory', () => ({
  createSpaceEndpoint: jest
    .fn()
    .mockReturnValue(jest.fn().mockImplementation((...res) => Promise.resolve(res)))
}));

jest.mock('data/CMA/SpaceAliasesRepo', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({ sys: { id: 'alias', version: 1 } }),
    update: jest.fn().mockImplementation((...res) => res),
    optIn: jest.fn().mockImplementation((...res) => res)
  })
}));

describe('Utils', () => {
  it('should opt-in', async () => {
    const res = await handleOptIn('spaceId', 'newEnvironmentId');
    expect(res).toEqual([{ newEnvironmentId: 'newEnvironmentId' }]);
  });

  it('should change-endpoint', async () => {
    const res = await handleChangeEnvironment(
      'spaceId',
      { sys: { id: 'alias' } },
      'aliasedEnvironment'
    );
    expect(res).toEqual([{ id: 'alias', version: 1, aliasedEnvironment: 'aliasedEnvironment' }]);
  });
});
