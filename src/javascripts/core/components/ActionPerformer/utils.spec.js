import { getUser, getApp, getActionPerformer } from './utils';
import { getModule } from 'core/NgRegistry';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { mockUser } from './__mocks__/mockUser';
import { appWidgetMock } from './__mocks__/appWidget';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('widgets/CustomWidgetLoaderInstance', () => ({ getCustomWidgetLoader: jest.fn() }));

describe('utils', () => {
  beforeEach(() => {
    getModule.mockReturnValue({
      users: {
        get: () => Promise.resolve(mockUser),
      },
      user: mockUser,
    });

    getCustomWidgetLoader.mockResolvedValue({
      getOne: () => Promise.resolve(appWidgetMock),
    });
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
      expect(await getUser('i-do-not-exist')).toBe('');
    });
  });

  describe('getApp', () => {
    it('should fetch the app widget for specific id', async () => {
      expect(await getApp('app-id')).toBe(appWidgetMock);
    });

    it('should return undefined when there is no app', async () => {
      getCustomWidgetLoader.mockResolvedValue({
        getOne: () => Promise.resolve(null),
      });

      expect(await getApp('i-do-not-exists')).toBe('');
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

    it('should return the app widget', async () => {
      expect(await getActionPerformer(mockedAppDefinitionSys)).toBe(appWidgetMock);
    });

    it('should return the user entity in the default case', async () => {
      expect(await getActionPerformer(defaultSys)).toBe(mockUser);
    });
  });
});
