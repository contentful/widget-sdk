import createPageExtensionBridge from './createPageExtensionBridge.es6';
import { LOCATION_PAGE } from '../WidgetLocations.es6';

jest.mock('Authentication.es6', () => ({ getToken: () => '<TOKEN>' }));

jest.mock('services/localeStore.es6', () => ({
  getPrivateLocales: () => [{ code: 'pl' }, { code: 'en' }],
  getDefaultLocale: () => ({ code: 'pl' })
}));

jest.mock('widgets/WidgetStore.es6', () => ({
  getForSingleExtension: jest.fn()
}));

describe('createPageExtensionBridge', () => {
  const makeBridge = () => {
    const stubs = {
      updateEntry: jest.fn(),
      getEntry: jest.fn(() => Promise.resolve('Entry data'))
    };
    const bridge = createPageExtensionBridge(
      {
        spaceContext: {
          getId: () => 'spaceId',
          getEnvironmentId: () => 'environmentId',
          isMasterEnvironment: () => false,
          cma: { updateEntry: stubs.updateEntry, getEntry: stubs.getEntry },
          space: { data: { spaceMember: 'MEMBER ', spaceMembership: 'MEMBERSHIP ' } }
        },
        Navigator: {
          go: jest.fn()
        },
        entitySelector: {},
        entityCreator: {},
        SlideInNavigator: {}
      },
      'test-id'
    );

    return [bridge, stubs];
  };

  describe('#apply()', () => {
    it('is function', () => {
      const [bridge] = makeBridge();

      expect(typeof bridge.apply).toBe('function');
    });
  });

  describe('#getData()', () => {
    it('returns ExtensionAPI data', () => {
      const [bridge] = makeBridge();

      expect(bridge.getData()).toEqual({
        environmentId: 'environmentId',
        spaceId: 'spaceId',
        location: LOCATION_PAGE,
        entryData: { fields: {}, sys: {} },
        locales: { available: [{ code: 'pl' }, { code: 'en' }], default: { code: 'pl' } },
        current: null,
        contentTypeData: { sys: {}, fields: [] },
        editorInterface: undefined,
        spaceMember: 'MEMBER ',
        spaceMembership: 'MEMBERSHIP '
      });
    });
  });
  describe('#install()', () => {
    it('registers all required methods', () => {
      const [bridge] = makeBridge();
      const api = { registerHandler: jest.fn() };
      bridge.install(api);

      expect(api.registerHandler.mock.calls.map(item => item[0]).sort()).toEqual([
        'callSpaceMethod',
        'navigateToContentEntity',
        'navigateToPageExtension',
        'notify',
        'openDialog'
      ]);
    });

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