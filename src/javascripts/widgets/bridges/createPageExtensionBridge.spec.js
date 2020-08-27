import createPageExtensionBridge from './createPageExtensionBridge';
import { WidgetLocation } from '@contentful/widget-renderer';

jest.mock('Authentication', () => ({ getToken: () => '<TOKEN>' }));

jest.mock('services/localeStore', () => ({
  getPrivateLocales: () => [{ code: 'pl' }, { code: 'en' }],
  getDefaultLocale: () => ({ code: 'pl' }),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

describe('createPageExtensionBridge', () => {
  const makeBridge = () => {
    const stubs = {
      updateEntry: jest.fn(),
      getEntry: jest.fn(() => Promise.resolve('Entry data')),
    };
    const bridge = createPageExtensionBridge(
      {
        spaceContext: {
          getId: () => 'spaceId',
          getEnvironmentId: () => 'environmentId',
          isMasterEnvironment: () => false,
          cma: { updateEntry: stubs.updateEntry, getEntry: stubs.getEntry },
          space: { data: { spaceMember: 'MEMBER ', spaceMembership: 'MEMBERSHIP ' } },
          publishedCTs: {
            getAllBare: () => [{ id: 'first-content-type' }, { id: 'second-content-type' }],
          },
        },
        entitySelector: {},
        entityCreator: {},
        currentWidgetId: 'id',
        currentWidgetNamespace: 'app',
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
        location: WidgetLocation.PAGE,
        entryData: { fields: {}, sys: {} },
        locales: { available: [{ code: 'pl' }, { code: 'en' }], default: { code: 'pl' } },
        current: null,
        contentTypeData: { sys: {}, fields: [] },
        initialContentTypesData: [{ id: 'first-content-type' }, { id: 'second-content-type' }],
        editorInterface: undefined,
        spaceMember: 'MEMBER ',
      });
    });
  });
  describe('#install()', () => {
    it('registers all required methods', () => {
      const [bridge] = makeBridge();
      const api = { registerHandler: jest.fn() };
      bridge.install(api);

      expect(api.registerHandler.mock.calls.map((item) => item[0]).sort()).toEqual([
        'callSpaceMethod',
        'checkAccess',
        'navigateToContentEntity',
        'navigateToPage',
        'navigateToPageExtension',
        'notify',
        'openDialog',
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
        expect(err.message).toBe('Request failed.');
      }
    });
  });
});
