import createExtensionBridge from './createExtensionBridge';
import { createBus } from 'core/utils/kefir';
import { LOCATION_ENTRY_FIELD } from '../WidgetLocations';
import * as entityCreator from 'components/app_container/entityCreator';
import * as entitySelector from 'search/EntitySelector/entitySelector';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import * as SlideInNavigatorWithPromise from 'navigation/SlideInNavigator/withPromise';
import * as WidgetLocations from 'widgets/WidgetLocations';
import * as AccessChecker from 'access_control/AccessChecker';

function createMockProperty(initial) {
  const bus = createBus();
  const property = bus.stream.toProperty(() => initial);
  property.set = (val) => bus.emit(val);

  return property;
}

jest.mock('Authentication', () => ({
  getToken: () => '<TOKEN>',
}));

jest.mock('services/localeStore', () => ({
  getPrivateLocales: () => [
    { code: 'pl', name: 'Polski' },
    { code: 'en', name: 'English' },
  ],
  getDefaultLocale: () => ({ code: 'pl', name: 'Polski', default: true }),
}));

jest.mock('../ExtensionDialogs', () => ({
  openAlert: jest.fn(() => Promise.resolve('ALERT RESULT')),
  openConfirm: jest.fn(() => Promise.resolve('CONFIRM RESULT')),
  openPrompt: jest.fn(() => Promise.resolve('PROMPT RESULT')),
}));

jest.mock('@contentful/forma-36-react-components', () => ({
  Notification: { success: jest.fn() },
}));

jest.mock('data/Endpoint', () => ({
  createOrganizationEndpoint: () => () => {},
  createAppDefinitionsEndpoint: () => () => {},
}));

jest.mock('core/services/BrowserStorage', () => ({
  getBrowserStorage: jest.fn(),
}));

jest.mock('components/app_container/entityCreator', () => ({
  newEntry: jest.fn().mockResolvedValue({ data: { sys: { type: 'Entry', id: 'some-entry-id' } } }),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(() => Promise.resolve()),
  makeEntityRef: jest.fn(() => 'ENTITY REF'),
}));

jest.mock('navigation/SlideInNavigator', () => ({
  goToSlideInEntity: jest.fn(),
  onSlideInNavigation: jest.fn(),
}));

jest.mock('navigation/SlideInNavigator/withPromise', () => ({
  goToSlideInEntityWithPromise: jest.fn(),
}));

jest.mock('search/EntitySelector/entitySelector', () => ({
  openFromExtension: jest.fn(() => Promise.resolve('DIALOG RESULT')),
}));

jest.mock('access_control/AccessChecker', () => ({
  can: jest.fn(),
  Action: {
    CREATE: 'create',
  },
}));

describe('createExtensionBridge', () => {
  const makeBridge = () => {
    const stubs = {
      apply: jest.fn(),
      sysProperty: createMockProperty({ id: 'test', initial: true }),
      changes: createMockProperty([]),
      access: createMockProperty({ disabled: false }),
      errors: createMockProperty([]),
      setValueAt: jest.fn((val) => Promise.resolve(val)),
      removeValueAt: jest.fn(() => Promise.resolve(undefined)),
      updateEntry: jest.fn(() => Promise.resolve('Entry updated')),
      setInvalid: jest.fn(),
      setActive: jest.fn(),
      getEntry: jest.fn(),
      $watch: jest.fn(),
    };

    const fieldLocale = {
      id: 'FIELD_ID',
      access$: stubs.access,
      errors$: stubs.errors,
      setActive: stubs.setActive,
      locales: ['pl'],
    };
    const $scope = {
      $on: () => {},
      $applyAsync: () => {},
      $watch: stubs.$watch,
      $new: () => ({}),
      otDoc: {
        sysProperty: stubs.sysProperty,
        changes: stubs.changes,
        getValueAt: () => ({ sys: {}, fields: {} }),
        setValueAt: stubs.setValueAt,
        removeValueAt: stubs.removeValueAt,
      },
      fieldController: { setInvalid: stubs.setInvalid },
      fields: [fieldLocale],
      fieldLocale,
      editorData: {
        editorInterface: {
          controls: [],
          sidebar: [],
        },
      },
      widget: { field: 'FIELD', fieldId: 'FIELD_ID' },
      widgets: [{ fieldId: 'FIELD_ID' }],
      locale: { code: 'pl' },
      entityInfo: { contentType: 'CONTENT TYPE' },
    };

    const bridge = createExtensionBridge({
      $rootScope: { $apply: stubs.apply },
      $scope,
      spaceContext: {
        getId: () => 'sid',
        getEnvironmentId: () => 'eid',
        isMasterEnvironment: () => false,
        cma: {
          updateEntry: stubs.updateEntry,
          getEntry: stubs.getEntry,
        },
        space: { data: { spaceMember: 'MEMBER ', spaceMembership: 'MEMBERSHIP ' } },
        publishedCTs: {
          getAllBare: () => [{ id: 'first-content-type' }, { id: 'second-content-type' }],
        },
      },
      $controller: (_name, _$scope) => ({
        access$: createMockProperty({ disconnected: false, disabled: false }),
      }),
      currentWidgetId: 'test-id',
      currentWidgetNamespace: 'extension',
      location: WidgetLocations.LOCATION_ENTRY_FIELD,
    });

    return [bridge, stubs];
  };

  const makeStubbedApi = () => ({
    registerHandler: jest.fn(),
    registerPathHandler: jest.fn(),
    send: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  });

  describe('#getData()', () => {
    it('returns ExtensionAPI data', () => {
      const [bridge] = makeBridge();

      expect(bridge.getData()).toEqual({
        environmentId: 'eid',
        spaceId: 'sid',
        location: LOCATION_ENTRY_FIELD,
        contentTypeData: 'CONTENT TYPE',
        initialContentTypesData: [{ id: 'first-content-type' }, { id: 'second-content-type' }],
        current: { field: 'FIELD', locale: { code: 'pl' } },
        entryData: { fields: {}, sys: {} },
        locales: {
          available: [
            { code: 'pl', name: 'Polski' },
            { code: 'en', name: 'English' },
          ],
          default: { code: 'pl', name: 'Polski', default: true },
        },
        spaceMember: 'MEMBER ',
        editorInterface: {
          controls: [],
          sidebar: [],
        },
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
      expect(api.send).toBeCalledWith('isDisabledChangedForFieldLocale', ['FIELD_ID', 'pl', false]);
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
          data: { shareJSCode: 'SJScode' },
        });
      }
    });

    it('registers entity selector dialog handler', async () => {
      const [bridge] = makeBridge();
      const api = makeStubbedApi();
      bridge.install(api);

      const registerCall = api.registerHandler.mock.calls[0];
      expect(registerCall[0]).toBe('openDialog');
      const openDialog = registerCall[1];
      expect(typeof openDialog).toBe('function');

      const result = await openDialog('entitySelector', { opts: true });
      expect(entitySelector.openFromExtension).toBeCalledWith({ opts: true });
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
        ['prompt', 'openPrompt'],
      ].map(async ([type, openMethod]) => {
        const result = await openDialog(type, { opts: true });
        const dialogs = jest.requireMock('../ExtensionDialogs');
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

    it('handles invalid space method calls', async () => {
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

    const returnedEntry = {
      sys: {
        type: 'Entry',
        id: 'xyz',
        space: { sys: { id: 'sid' } },
        environment: { sys: { id: 'eid' } },
      },
    };

    stubs.getEntry.mockResolvedValue(returnedEntry);

    const registerCall = api.registerHandler.mock.calls[2];
    expect(registerCall[0]).toBe('navigateToContentEntity');
    expect(api.registerHandler.mock.calls[3][0]).toBe('navigateToBulkEditor');
    const navigate = registerCall[1];
    expect(typeof navigate).toBe('function');

    const openResult = await navigate({ id: 'xyz', entityType: 'Entry', slideIn: true });
    expect(openResult).toEqual({ navigated: true, entity: returnedEntry });
    expect(stubs.getEntry).toHaveBeenCalledWith('xyz');
    expect(SlideInNavigator.goToSlideInEntity).toBeCalledTimes(1);
    expect(SlideInNavigator.goToSlideInEntity).toBeCalledWith({
      id: returnedEntry.sys.id,
      type: returnedEntry.sys.type,
    });

    const openResultOnClose = await navigate({
      id: 'xyz',
      entityType: 'Entry',
      slideIn: { waitForClose: true },
    });
    expect(openResultOnClose).toEqual({ navigated: true, entity: returnedEntry });
    expect(stubs.getEntry).toHaveBeenCalledWith('xyz');
    expect(SlideInNavigatorWithPromise.goToSlideInEntityWithPromise).toBeCalledTimes(1);
    expect(SlideInNavigatorWithPromise.goToSlideInEntityWithPromise).toBeCalledWith({
      id: returnedEntry.sys.id,
      type: returnedEntry.sys.type,
    });

    const createResult = await navigate({ entityType: 'Entry', contentTypeId: 'ctid' });
    expect(createResult).toEqual({
      navigated: true,
      entity: expect.any(Object),
    });
    expect(entityCreator.newEntry).toBeCalledTimes(1);
    expect(entityCreator.newEntry).toBeCalledWith('ctid');
    expect(Navigator.go).toBeCalledWith('ENTITY REF');
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

    const registerCall = api.registerHandler.mock.calls[4];
    expect(registerCall[0]).toBe('notify');
    const notify = registerCall[1];
    expect(typeof notify).toBe('function');

    const result = await notify({ type: 'success', message: 'test' });
    expect(result).toBeUndefined();
    const { Notification } = jest.requireMock('@contentful/forma-36-react-components');
    expect(Notification.success).toBeCalledTimes(1);
    expect(Notification.success).toBeCalledWith('test');
  });

  it('registers navigateToPageExtension', async () => {
    const [bridge] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    const registerCall = api.registerHandler.mock.calls[5];
    expect(registerCall[0]).toBe('navigateToPageExtension');
    const navigateToPageExtension = registerCall[1];
    expect(typeof navigateToPageExtension).toBe('function');

    const result = await navigateToPageExtension({ id: 'test-id' });
    expect(result).toEqual({ navigated: true });
  });

  it('registers navigateToPage', async () => {
    const [bridge] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    const registerCall = api.registerHandler.mock.calls[6];
    expect(registerCall[0]).toBe('navigateToPage');
    const navigateToPage = registerCall[1];

    const result = await navigateToPage({ id: 'app-id', path: '/something' });
    expect(result).toEqual({ navigated: true, path: '/something' });
  });

  it('registers access handlers', () => {
    const [bridge] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    const registerCalls = api.registerHandler.mock.calls;
    expect(registerCalls[7][0]).toBe('checkAccess');
    const checkAcces = registerCalls[7][1];

    checkAcces('create', 'Entry');
    expect(AccessChecker.can).toHaveBeenCalledWith('create', 'Entry');
  });

  it('registers invalid and active handlers', () => {
    const [bridge, stubs] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    const registerCalls = api.registerHandler.mock.calls;
    expect(registerCalls[8][0]).toBe('setInvalid');
    const setInvalid = registerCalls[8][1];
    expect(registerCalls[9][0]).toBe('setActive');
    const setActive = registerCalls[9][1];

    setInvalid(true, 'de-DE');
    expect(stubs.setInvalid).toBeCalledWith('de-DE', true);

    setActive(true);
    expect(stubs.setActive).toBeCalledWith(true);
  });

  it('watches changes in $scope.localeData and $scope.preferences.showDisabledFields', () => {
    const [bridge, stubs] = makeBridge();
    const api = makeStubbedApi();
    bridge.install(api);

    expect(stubs.$watch).toHaveBeenCalledTimes(4);
    expect(stubs.$watch).toHaveBeenNthCalledWith(
      1,
      'preferences.showDisabledFields',
      expect.any(Function)
    );
    expect(stubs.$watch).toHaveBeenNthCalledWith(
      2,
      'localeData.activeLocales',
      expect.any(Function)
    );
    expect(stubs.$watch).toHaveBeenNthCalledWith(
      3,
      'localeData.isSingleLocaleModeOn',
      expect.any(Function)
    );
    expect(stubs.$watch).toHaveBeenNthCalledWith(
      4,
      'localeData.focusedLocale',
      expect.any(Function)
    );
  });
});
