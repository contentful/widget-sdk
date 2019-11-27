import {
  handleOptIn,
  handleChangeEnvironment,
  isAContentSpecificPage,
  isAnEnvironmentAwarePage
} from './Utils';
import { setWindowLocationProperties } from '__mocks__/global/window';

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

  it('should check that a page is environment aware', () => {
    setWindowLocationProperties({ pathname: '/spaces/extensions' });
    const res = isAnEnvironmentAwarePage();
    expect(res).toBe(true);
  });

  it('should check that a page is not environment aware', () => {
    setWindowLocationProperties({ pathname: '/spaces/content_types' });
    const res = isAnEnvironmentAwarePage();
    expect(res).toBe(false);
  });

  it('should check that a page is content specific', () => {
    setWindowLocationProperties({ pathname: '/spaces/content_types' });
    const res = isAContentSpecificPage();
    expect(res).toBe(true);
  });

  it('should check that a page is not content specific', () => {
    setWindowLocationProperties({ pathname: '/spaces/extensions' });
    const res = isAContentSpecificPage();
    expect(res).toBe(false);
  });
});
