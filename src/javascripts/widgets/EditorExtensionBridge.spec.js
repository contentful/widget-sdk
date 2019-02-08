import createBridge from './EditorExtensionBridge.es6';
import { createBus } from 'utils/kefir.es6';
import { LOCATION_ENTRY_FIELD } from './WidgetLocations.es6';

function createMockProperty(initial) {
  const bus = createBus();
  const property = bus.stream.toProperty(() => initial);
  property.set = val => bus.emit(val);

  return property;
}

jest.mock('./ExtensionDialogs.es6', () => ({
  openAlert: jest.fn(() => Promise.resolve('ALERT RESULT')),
  openConfirm: jest.fn(() => Promise.resolve('CONFIRM RESULT')),
  openPrompt: jest.fn(() => Promise.resolve('PROMPT RESULT'))
}));

jest.mock('@contentful/forma-36-react-components', () => ({
  Notification: { success: jest.fn() }
}));

describe('EditorExtensionBridge', () => {
  const makeBridge = () => {
    const stubs = {
      apply: jest.fn(),
      sysProperty: createMockProperty({ id: 'test', initial: true }),
      changes: createMockProperty([]),
      access: createMockProperty({ disabled: false }),
      errors: createMockProperty([]),
      setValueAt: jest.fn(val => Promise.resolve(val)),
      removeValueAt: jest.fn(() => Promise.resolve(undefined)),
      openFromExtension: jest.fn(() => Promise.resolve('DIALOG RESULT')),
      updateEntry: jest.fn(() => Promise.resolve('Entry updated')),
      setInvalid: jest.fn(),
      setActive: jest.fn(),
      newEntry: jest.fn(() => ({ sys: { type: 'Entry', id: 'some-entry-id' } })),
      goToSlideInEntity: jest.fn(),
      navigatorGo: jest.fn(() => Promise.resolve()),
      makeEntityRef: jest.fn(() => 'ENTITY REF')
    };

    const bridge = createBridge({
      $rootScope: { $apply: stubs.apply },
      $scope: {
        $on: () => {},
        $applyAsync: () => {},
        otDoc: {
          sysProperty: stubs.sysProperty,
          changes: stubs.changes,
          getValueAt: () => ({ sys: {}, fields: {} }),
          setValueAt: stubs.setValueAt,
          removeValueAt: stubs.removeValueAt
        },
        fieldController: { setInvalid: stubs.setInvalid },
        fieldLocale: {
          access$: stubs.access,
          errors$: stubs.errors,
          setActive: stubs.setActive
        },
        widget: { field: 'FIELD' },
        locale: { code: 'pl' },
        entityInfo: { contentType: 'CONTENT TYPE' }
      },
      spaceContext: {
        getId: () => 'sid',
        getEnvironmentId: () => 'eid',
        cma: { updateEntry: stubs.updateEntry },
        space: { data: { spaceMembership: 'MEMBERSHIP ' } }
      },
      TheLocaleStore: {
        getPrivateLocales: () => [{ code: 'pl', name: 'Polski' }, { code: 'en', name: 'English' }],
        getDefaultLocale: () => ({ code: 'pl', name: 'Polski', default: true })
      },
      Analytics: {},
      entitySelector: { openFromExtension: stubs.openFromExtension },
      entityCreator: { newEntry: stubs.newEntry },
      SlideInNavigator: { goToSlideInEntity: stubs.goToSlideInEntity },
      Navigator: {
        go: stubs.navigatorGo,
        makeEntityRef: stubs.makeEntityRef
      }
    });

    return [bridge, stubs];
  };

  const makeStubbedApi = () => ({
    registerHandler: jest.fn(),
    registerPathHandler: jest.fn(),
    send: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  });

  describe('#getData()', () => {
    it('returns ExtensionAPI data', () => {
      const [bridge] = makeBridge();

      expect(bridge.getData()).toEqual({
        location: LOCATION_ENTRY_FIELD,
        contentTypeData: 'CONTENT TYPE',
        current: { field: 'FIELD', locale: { code: 'pl' } },
        entryData: { fields: {}, sys: {} },
        locales: {
          available: [{ code: 'pl', name: 'Polski' }, { code: 'en', name: 'English' }],
          default: { code: 'pl', name: 'Polski', default: true }
        },
        spaceMembership: 'MEMBERSHIP '
      });
    });
  });

  describe('#apply()', () => {
    it('calls its argument inside of $rootScope.$apply', () => {
      const [bridge, stubs] = makeBridge();

      const fn = jest.fn();
      bridge.apply(fn);

      expect(stubs.apply).toBeCalledTimes(1);
      expect(stubs.apply).toBeCalledWith(fn);
    });
  });

  describe('#install()', () => {
    it('notifies when access, sys or errors are changed', () => {
      const [bridge, stubs] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      // initial values
      expect(api.send).toBeCalledWith('isDisabledChanged', [false]);
      expect(api.send).toBeCalledWith('sysChanged', [{ id: 'test', initial: true }]);
      expect(api.send).toBeCalledWith('schemaErrorsChanged', [[]]);

      // changes
      stubs.access.set({ disabled: true });

      expect(api.send).toBeCalledWith('isDisabledChanged', [true]);

      stubs.sysProperty.set({ id: 'test', initial: false });
      expect(api.send).toBeCalledWith('sysChanged', [{ id: 'test', initial: false }]);

      stubs.errors.set([{ message: 'some error' }]);
      expect(api.send).toBeCalledWith('schemaErrorsChanged', [[{ message: 'some error' }]]);
    });

    it('updates when the doc changes on top level or fields', () => {
      const [bridge, stubs] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      // initial value
      expect(api.update).toBeCalledWith([], { sys: {}, fields: {} });
      // change
      stubs.changes.set(['fields', 'x']);
      expect(api.update).toBeCalledWith(['fields', 'x'], { sys: {}, fields: {} });
      // change not affecting fields
      stubs.changes.set(['sys', 'version']);
      expect(api.update).not.toBeCalledWith(['sys', 'version'], { sys: {}, fields: {} });

      expect(api.update).toBeCalledTimes(2);
    });

    it('registers doc handlers', async () => {
      const [bridge, stubs] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      const registerCalls = api.registerPathHandler.mock.calls;
      expect(registerCalls[0][0]).toBe('setValue');
      const setValue = registerCalls[0][1];
      expect(registerCalls[1][0]).toBe('removeValue');
      const removeValue = registerCalls[1][1];

      const result = await setValue(['fields', 'foo'], true);
      expect(stubs.setValueAt).toBeCalledWith(['fields', 'foo'], true);
      expect(result).toBe(true);

      const removeResult = await removeValue(['fields', 'bar']);
      expect(stubs.removeValueAt).toBeCalledWith(['fields', 'bar']);
      expect(removeResult).toBeUndefined();
    });

    it('handles doc errors', async () => {
      const [bridge, stubs] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      const setValue = api.registerPathHandler.mock.calls[0][1];
      stubs.setValueAt.mockImplementation(() => Promise.reject({ message: 'SJScode' }));

      expect.assertions(1);
      try {
        await setValue(['fields', 'foo'], true);
      } catch (err) {
        expect(err).toMatchObject({
          message: 'Could not update entry field',
          code: 'ENTRY UPDATE FAILED',
          data: { shareJSCode: 'SJScode' }
        });
      }
    });

    it('registers entity selector dialog handler', async () => {
      const [bridge, stubs] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      const registerCall = api.registerHandler.mock.calls[0];
      expect(registerCall[0]).toBe('openDialog');
      const openDialog = registerCall[1];
      expect(typeof openDialog).toBe('function');

      const result = await openDialog('entitySelector', { opts: true });
      expect(stubs.openFromExtension).toBeCalledWith({ opts: true });
      expect(result).toBe('DIALOG RESULT');
    });

    it('registers simple dialog handlers', async () => {
      const [bridge] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      const registerCall = api.registerHandler.mock.calls[0];
      expect(registerCall[0]).toBe('openDialog');
      const openDialog = registerCall[1];
      expect(typeof openDialog).toBe('function');

      const scenarios = [
        ['alert', 'openAlert'],
        ['confirm', 'openConfirm'],
        ['prompt', 'openPrompt']
      ].map(async ([type, openMethod]) => {
        const result = await openDialog(type, { opts: true });
        const dialogs = jest.requireMock('./ExtensionDialogs.es6');
        expect(dialogs[openMethod]).toBeCalledTimes(1);
        expect(dialogs[openMethod]).toBeCalledWith({ opts: true });
        expect(result).toBe(`${type.toUpperCase()} RESULT`);
      });

      await Promise.all(scenarios);
    });

    it('registers space method handlers', async () => {
      const [bridge, stubs] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      const registerCall = api.registerHandler.mock.calls[1];
      expect(registerCall[0]).toBe('callSpaceMethod');
      const callSpaceMethod = registerCall[1];
      expect(typeof callSpaceMethod).toBe('function');

      const result = await callSpaceMethod('updateEntry', [{ data: 'data' }, true]);
      expect(stubs.updateEntry).toBeCalledWith({ data: 'data' }, true);
      expect(result).toBe('Entry updated');
    });

    it('handles invlid space method calls', async () => {
      const [bridge] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      expect.assertions(1);
      try {
        const callSpaceMethod = api.registerHandler.mock.calls[1][1];
        await callSpaceMethod('no such method', { data: 'data' });
      } catch (err) {
        expect(err).toMatchObject({ message: 'Request failed.' });
      }
    });
  });

  it('registers navigator method handlers', async () => {
    const [bridge, stubs] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    const registerCall = api.registerHandler.mock.calls[2];
    expect(registerCall[0]).toBe('navigateToContentEntity');
    const navigate = registerCall[1];
    expect(typeof navigate).toBe('function');

    const openResult = await navigate({ id: 'xyz', entityType: 'Entry', slideIn: true });
    expect(openResult).toEqual({ navigated: true });
    expect(stubs.goToSlideInEntity).toBeCalledTimes(1);
    expect(stubs.goToSlideInEntity).toBeCalledWith({
      type: 'Entry',
      id: 'xyz',
      space: { sys: { id: 'sid' } },
      environment: { sys: { id: 'eid' } }
    });

    const createResult = await navigate({ entityType: 'Entry', contentTypeId: 'ctid' });
    expect(createResult).toEqual({ navigated: true });
    expect(stubs.newEntry).toBeCalledTimes(1);
    expect(stubs.newEntry).toBeCalledWith('ctid');
    expect(stubs.navigatorGo).toBeCalledWith('ENTITY REF');
  });

  it('handles invalid navigator calls', async () => {
    const [bridge] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    expect.assertions(1);
    try {
      const navigate = api.registerHandler.mock.calls[2][1];
      await navigate({ type: 'UIConfig' });
    } catch (err) {
      expect(err).toMatchObject({ message: 'Unknown entity type.' });
    }
  });

  it('registers notifier handlers', async () => {
    const [bridge] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    const registerCall = api.registerHandler.mock.calls[3];
    expect(registerCall[0]).toBe('notify');
    const notify = registerCall[1];
    expect(typeof notify).toBe('function');

    const result = await notify({ type: 'success', message: 'test' });
    expect(result).toBeUndefined();
    const { Notification } = jest.requireMock('@contentful/forma-36-react-components');
    expect(Notification.success).toBeCalledTimes(1);
    expect(Notification.success).toBeCalledWith('test');
  });

  it('registers invalid and active handlers', () => {
    const [bridge, stubs] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    const registerCalls = api.registerHandler.mock.calls;
    expect(registerCalls[4][0]).toBe('setInvalid');
    const setInvalid = registerCalls[4][1];
    expect(registerCalls[5][0]).toBe('setActive');
    const setActive = registerCalls[5][1];

    setInvalid(true, 'de-DE');
    expect(stubs.setInvalid).toBeCalledWith('de-DE', true);

    setActive(true);
    expect(stubs.setActive).toBeCalledWith(true);
  });
});
