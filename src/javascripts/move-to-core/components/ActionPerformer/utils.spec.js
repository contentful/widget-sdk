import { getUser, getApp, getActionPerformer } from './utils';
import { getModule } from 'core/NgRegistry';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { mockUser } from './__mocks__/mockUser';
import { appDefinitionsMock } from './__mocks__/appDefinition';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('widgets/CustomWidgetLoaderInstance', () => ({ getCustomWidgetLoader: jest.fn() }));

getModule.mockReturnValue({
  users: {
    get: () => Promise.resolve(mockUser),
  },
  user: mockUser,
});

getCustomWidgetLoader.mockReturnValue({
  getByKeys: () => Promise.resolve(appDefinitionsMock),
});

describe('getUser', () => {
  it('should fetch the current user specified by id', async () => {
    expect(await getUser('some-id')).toBe(mockUser);
  });

  it('should fail when there is no user found unter the given id ', async () => {
    getModule.mockReturnValueOnce({
      users: {
        get: () => Promise.resolve(null),
      },
    });
    expect(await getUser('i-do-not-exist')).toBeNull();
  });
});

describe('getApp', () => {
  it('should fetch the app definition for specific id', async () => {
    expect(await getApp('app-id')).toBe(appDefinitionsMock[0]);
  });

  it('should return undefined when there is no app', async () => {
    getCustomWidgetLoader.mockReturnValueOnce({
      getByKeys: () => Promise.resolve([]),
    });

    expect(await getApp('i-do-not-exists')).toBeUndefined();
  });
});

describe('getActionPerformer', () => {
  const mockedAppDefinitionSys = {
    sys: {
      linkType: 'AppDefinition',
      id: 'someId',
    },
  };

  const mockedUserSys = {
    sys: {
      linkType: 'User',
      id: 'someId',
    },
  };

  const defaultSys = {
    sys: {
      linkType: 'I do not exist',
      id: 'someId',
    },
  };

  it('should return the user entity', async () => {
    expect(await getActionPerformer(mockedUserSys)).toBe(mockUser);
  });

  it('should return the app definiton entity', async () => {
    expect(await getActionPerformer(mockedAppDefinitionSys)).toBe(appDefinitionsMock[0]);
  });

  it('should return the user entity in the default case', async () => {
    expect(await getActionPerformer(defaultSys)).toBe(mockUser);
  });
});
