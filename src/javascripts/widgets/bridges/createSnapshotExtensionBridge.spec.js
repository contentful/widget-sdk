import createSnapshotExtensionBridge from './createSnapshotExtensionBridge';
import { LOCATION_ENTRY_FIELD } from '../WidgetLocations';
import { getModule } from 'core/NgRegistry';

jest.mock('Authentication', () => ({ getToken: () => '<TOKEN>' }));
jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
jest.mock('services/localeStore', () => ({
  getPrivateLocales: () => [{ code: 'pl' }, { code: 'en' }],
  getDefaultLocale: () => ({ code: 'pl' }),
}));

describe('createSnaphotExtensionBridge', () => {
  const stubs = {
    updateEntry: jest.fn(),
    getEntry: jest.fn(() => Promise.resolve('Entry data')),
  };

  getModule.mockImplementation(() => ({
    getId: () => 'spaceId',
    getEnvironmentId: () => 'environmentId',
    cma: stubs,
    space: { data: { spaceMember: 'MEMBER ', spaceMembership: 'MEMBERSHIP ' } },
    publishedCTs: {
      getAllBare: () => [{ id: 'first-content-type' }, { id: 'second-content-type' }],
    },
  }));

  const makeBridge = () => {
    const bridge = createSnapshotExtensionBridge({
      field: 'FIELD',
      locale: { code: 'pl' },
      entity: { sys: {}, fields: {} },
      editorData: {
        contentType: { data: { name: 'someContentType', sys: { id: '123' } } },
        editorInterface: {
          controls: [],
          sidebar: [],
        },
      },
    });

    return [bridge, stubs];
  };

  describe('#getData()', () => {
    it('returns ExtensionAPI data', () => {
      const [bridge] = makeBridge();

      expect(bridge.getData()).toEqual({
        environmentId: 'environmentId',
        spaceId: 'spaceId',
        location: LOCATION_ENTRY_FIELD,
        contentTypeData: { name: 'someContentType', sys: { id: '123' } },
        initialContentTypesData: [{ id: 'first-content-type' }, { id: 'second-content-type' }],
        current: { field: 'FIELD', locale: { code: 'pl' } },
        entryData: { fields: {}, sys: {} },
        locales: { available: [{ code: 'pl' }, { code: 'en' }], default: { code: 'pl' } },
        spaceMember: 'MEMBER ',
        editorInterface: {
          controls: [],
          sidebar: [],
        },
      });
    });
  });

  describe('#apply()', () => {
    it('is function', () => {
      const [bridge] = makeBridge();

      expect(typeof bridge.apply).toBe('function');
    });
  });

  describe('#install()', () => {
    it('registers space method handlers', async () => {
      const [bridge, stubs] = makeBridge();
      const api = { registerHandler: jest.fn() };
      bridge.install(api);

      const registerCall = api.registerHandler.mock.calls[0];
      expect(registerCall[0]).toBe('callSpaceMethod');
      const callSpaceMethod = registerCall[1];
      expect(typeof callSpaceMethod).toBe('function');

      const result = await callSpaceMethod('getEntry', [{ data: 'data' }, true]);
      expect(stubs.getEntry).toBeCalledWith({ data: 'data' }, true);
      expect(result).toBe('Entry data');
    });

    it('does not allow to use mutating space methods', async () => {
      const [bridge, stubs] = makeBridge();
      const api = { registerHandler: jest.fn() };
      bridge.install(api);

      expect.assertions(2);
      try {
        const callSpaceMethod = api.registerHandler.mock.calls[0][1];
        await callSpaceMethod('updateEntry', { data: 'data' });
      } catch (err) {
        expect(stubs.updateEntry).not.toBeCalled();
        expect(err).toMatchObject({ message: 'Cannot modify data in read-only mode.' });
      }
    });
  });
});
