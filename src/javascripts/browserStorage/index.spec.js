import $window from 'utils/ngCompat/window';
import * as storeUtils from './utils';
import { getStore } from './index';
import ClientStorageWrapper from './ClientStorageWrapper';
import ClientStorage from './ClientStorage';

jest.mock('utils/ngCompat/window', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  localStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  },
  sessionStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  }
}));

describe('TheStore', () => {
  let storage;
  let primatives;

  beforeEach(() => {
    primatives = {
      '1': 1,
      '1.1': 1.1,
      true: true,
      null: null
    };

    storage = {
      set: jest.fn(),
      get: jest.fn(),
      remove: jest.fn(),
      type: 'storage'
    };
  });

  afterEach(() => {
    $window.addEventListener.mockReset();
    $window.removeEventListener.mockReset();
    $window.localStorage.setItem.mockReset();
    $window.localStorage.getItem.mockReset();
    $window.localStorage.removeItem.mockReset();
    $window.sessionStorage.setItem.mockReset();
    $window.sessionStorage.getItem.mockReset();
    $window.sessionStorage.removeItem.mockReset();
  });

  describe('#getStore', () => {
    it('should return the default local storage if called with no arguments', function() {
      const local = getStore();

      local.set('localKey', 'localValue');
      expect($window.localStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should return the storage based on given argument', function() {
      const local = getStore('local');
      const session = getStore('session');

      // Test localStorage
      local.set('localKey', 'localValue');
      expect($window.localStorage.setItem).toHaveBeenCalledTimes(1);

      // Test sessionStorage
      session.set('sessionKey', 'sessionValue');
      expect($window.sessionStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('utils', () => {
    describe('#set', () => {
      it('stores string as is', function() {
        storeUtils.set(storage, 'test', 'test-string');
        expect(storage.set).toHaveBeenCalledWith('test', 'test-string');
      });

      it('stores primitives stringified', function() {
        Object.keys(primatives).forEach(str => {
          storeUtils.set(storage, 'test', primatives[str]);
          expect(storage.set).toHaveBeenCalledWith('test', str);
        });
      });

      it('stores objects stringified', function() {
        storeUtils.set(storage, 'test', { test: true });
        expect(storage.set).toHaveBeenCalledWith('test', '{"test":true}');
      });
    });

    describe('#get', () => {
      it('returns null for non-existent value', function() {
        storage.get.mockReturnValueOnce(null);
        expect(storeUtils.get(storage, 'non-existent')).toBeNull();
      });

      it('returns string as is', function() {
        storage.get.mockReturnValueOnce('test-string');
        expect(storeUtils.get(storage, 'test')).toEqual('test-string');
      });

      it('returns primitives parsed', function() {
        Object.keys(primatives).forEach(str => {
          storage.get.mockReturnValueOnce(str);
          expect(storeUtils.get(storage, 'test')).toEqual(primatives[str]);
        });
      });

      it('returns objects parsed', function() {
        storage.get.mockReturnValueOnce('{"test":true}');
        expect(storeUtils.get(storage, 'test')).toEqual({ test: true });
      });
    });

    describe('#remove', () => {
      it('proxies to underlying remove function', function() {
        storeUtils.remove(storage, 'test');
        expect(storage.remove).toHaveBeenCalledWith('test');
      });
    });

    describe('#has', () => {
      it('returns bool depending on #get result', function() {
        storage.get.mockReturnValueOnce('test-string');
        expect(storeUtils.has(storage, 'test')).toEqual(true);
        expect(storage.get).toHaveBeenCalledWith('test');

        storage.get.mockReturnValueOnce(null);
        expect(storeUtils.has(storage, 'non-existent')).toEqual(false);
        expect(storage.get).toHaveBeenCalledWith('non-existent');
      });
    });

    describe('#externalChanges', () => {
      it('emits value on `storage` window event after setting in localstorage', function() {
        storeUtils.set(storage, 'mykey', 'initial');

        $window.addEventListener.mockImplementation((messageType, cb) => {
          if (messageType === 'storage') {
            return cb({
              key: 'mykey',
              newValue: 'newvalue'
            });
          }
        });

        const changes$ = storeUtils.externalChanges('mykey');
        const emittedChange = jest.fn();

        changes$.onValue(emittedChange);

        expect(emittedChange).toHaveBeenCalledWith('newvalue');
      });
    });
  });

  describe('TheStore/ClientStorageWrapper', () => {
    let SessionStorageWrapper;
    let LocalStorageWrapper;

    beforeEach(function() {
      SessionStorageWrapper = ClientStorageWrapper('session');
      LocalStorageWrapper = ClientStorageWrapper('local');
    });

    it('exposes a simplified Local/Session Storage API', function() {
      [LocalStorageWrapper, SessionStorageWrapper].forEach(wrapper => {
        ['setItem', 'getItem', 'removeItem'].forEach(method => {
          expect(typeof wrapper[method]).toEqual('function');
        });
      });
    });
  });

  describe('TheStore/StorageStore', () => {
    let ClientStorageLocal;
    let ClientStorageSession;

    beforeEach(function() {
      ClientStorageLocal = ClientStorage('local');
      ClientStorageSession = ClientStorage('session');
    });

    it('proxies its methods directly to the wrapper', function() {
      ClientStorageLocal.set();
      expect($window.localStorage.setItem).toHaveBeenCalledTimes(1);

      ClientStorageLocal.get();
      expect($window.localStorage.getItem).toHaveBeenCalledTimes(1);

      ClientStorageLocal.remove();
      expect($window.localStorage.removeItem).toHaveBeenCalledTimes(1);

      ClientStorageSession.set();
      expect($window.sessionStorage.setItem).toHaveBeenCalledTimes(1);

      ClientStorageSession.get();
      expect($window.sessionStorage.getItem).toHaveBeenCalledTimes(1);

      ClientStorageSession.remove();
      expect($window.sessionStorage.removeItem).toHaveBeenCalledTimes(1);
    });
  });
});
