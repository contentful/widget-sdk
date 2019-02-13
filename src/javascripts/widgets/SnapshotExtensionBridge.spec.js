import createBridge from './SnapshotExtensionBridge.es6';

describe('SnapshotExtensionBridge', () => {
  const stubs = {
    updateEntry: jest.fn(),
    getEntry: jest.fn(() => Promise.resolve('Entry data'))
  };

  const makeBridge = () => {
    const bridge = createBridge({
      $scope: {
        widget: { field: 'FIELD' },
        locale: { code: 'pl' },
        entity: { sys: {}, fields: {} },
        entityInfo: {
          contentType: 'CONTENT TYPE'
        }
      },
      spaceContext: {
        cma: { updateEntry: stubs.updateEntry, getEntry: stubs.getEntry },
        space: { data: { spaceMembership: 'MEMBERSHIP ' } }
      },
      TheLocaleStore: {
        getPrivateLocales: () => [{ code: 'pl' }, { code: 'en' }],
        getDefaultLocale: () => ({ code: 'pl' })
      }
    });

    return [bridge, stubs];
  };

  describe('#getData()', () => {
    it('returns ExtensionAPI data', () => {
      const [bridge] = makeBridge();

      expect(bridge.getData()).toEqual({
        contentTypeData: 'CONTENT TYPE',
        current: { field: 'FIELD', locale: { code: 'pl' } },
        entryData: { fields: {}, sys: {} },
        locales: { available: [{ code: 'pl' }, { code: 'en' }], default: { code: 'pl' } },
        spaceMembership: 'MEMBERSHIP '
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
        expect(err).toMatchObject({ message: 'Cannot modify data when comparing versions.' });
      }
    });
  });
});
