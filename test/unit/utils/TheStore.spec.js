/* global window */

import StorageWrapper from 'utils/TheStore/StorageWrapper';
import { getStore } from 'utils/TheStore';

import { createIsolatedSystem } from 'test/helpers/system-js';

describe('utils/TheStore', function () {
  describe('#getStore', function () {
    it('should return the default local storage if called with no arguments', function () {
      expect(getStore().type).toBe('LocalStorageStore');
    });

    it('should return the specified storage type if requested', function () {
      expect(getStore('local').type).toBe('LocalStorageStore');
      expect(getStore('session').type).toBe('SessionStorageStore');
      expect(getStore('cookie').type).toBe('CookieStore');
    });
  });

  describe('utils', function () {
    const primitives = {
      '1': 1,
      '1.1': 1.1,
      'true': true,
      'null': null
    };

    let storage;
    let system;
    let listeners;
    let storeUtils;

    beforeEach(function* () {
      storage = {
        set: sinon.stub(),
        get: sinon.stub(),
        remove: sinon.stub(),
        type: 'storage'
      };

      listeners = {
        addEventListener: sinon.stub(),
        removeEventListener: sinon.stub()
      };

      system = createIsolatedSystem();

      system.set('global/window', {
        default: {
          addEventListener: listeners.addEventListener,
          removeEventListener: listeners.removeEventListener
        }
      });

      storeUtils = yield system.import('utils/store_utils');
    });

    describe('#set', function () {
      it('stores string as is', function () {
        storeUtils.set(storage, 'test', 'test-string');

        sinon.assert.calledOnce(storage.set.withArgs('test', 'test-string'));
      });

      it('stores primitives stringified', function () {
        Object.keys(primitives).forEach((str) => {
          storeUtils.set(storage, 'test', primitives[str]);
          sinon.assert.called(storage.set.withArgs('test', str));
        });
      });

      it('stores objects stringified', function () {
        storeUtils.set(storage, 'test', {test: true});
        sinon.assert.calledOnce(storage.set.withArgs('test', '{"test":true}'));
      });
    });

    describe('#get', function () {
      it('returns null for non-existent value', function () {
        storage.get.returns(null);
        expect(storeUtils.get(storage, 'non-existent')).toEqual(null);
      });

      it('returns string as is', function () {
        storage.get.returns('test-string');
        expect(storeUtils.get(storage, 'test')).toEqual('test-string');
      });

      it('returns primitives parsed', function () {
        Object.keys(primitives).forEach((str) => {
          storage.get.returns(str);
          expect(storeUtils.get(storage, 'test')).toEqual(primitives[str]);
        });
      });

      it('returns objects parsed', function () {
        storage.get.returns('{"test":true}');
        expect(storeUtils.get(storage, 'test')).toEqual({test: true});
      });
    });

    describe('#remove', function () {
      it('proxies to underlying remove function', function () {
        storeUtils.remove(storage, 'test');
        sinon.assert.calledOnce(storage.remove.withArgs('test'));
      });
    });

    describe('#has', function () {
      it('returns bool depending on #get result', function () {
        storage.get.returns('test-string');
        expect(storeUtils.has(storage, 'test')).toEqual(true);
        sinon.assert.called(storage.get.withArgs('test'));

        storage.get.returns(null);
        expect(storeUtils.has(storage, 'non-existent')).toEqual(false);
        sinon.assert.called(storage.get.withArgs('non-existent'));
      });
    });

    describe('#externalChanges', function () {
      it('emits value on `storage` window event after setting in local/session storage', function () {
        storeUtils.set(storage, 'mykey', 'initial');

        const changes$ = storeUtils.externalChanges('mykey');
        const emittedChange = sinon.stub();

        changes$.onValue(emittedChange);

        listeners.addEventListener.withArgs('storage').yield({key: 'mykey', newValue: 'newvalue'});
        sinon.assert.calledOnceWith(emittedChange, 'newvalue');
      });
    });
  });


  describe('utils/TheStore/StorageWrapper', function () {
    let SessionStorageWrapper;
    let LocalStorageWrapper;

    beforeEach(function () {
      SessionStorageWrapper = StorageWrapper('session');
      LocalStorageWrapper = StorageWrapper('local');
    });

    it('exposes a simplified Local/Session Storage API', function () {
      [ LocalStorageWrapper, SessionStorageWrapper ].forEach(function (wrapper) {
        ['setItem', 'getItem', 'removeItem'].forEach(function (method) {
          expect(typeof wrapper[method]).toEqual('function');
        });
      });
    });
  });

  describe('utils/TheStore/StorageStore', function () {
    const stubs = {};
    let system;
    let StorageStore;
    let LocalStorageStore;
    let SessionStorageStore;

    beforeEach(function* () {
      stubs.setItem = sinon.stub();
      stubs.getItem = sinon.stub();
      stubs.removeItem = sinon.stub();

      system = createIsolatedSystem();

      system.set('utils/TheStore/StorageWrapper', {
        default: function () {
          return {
            setItem: stubs.setItem,
            getItem: stubs.getItem,
            removeItem: stubs.removeItem
          };
        }
      });

      StorageStore = (yield system.import('utils/TheStore/StorageStore')).default;

      LocalStorageStore = StorageStore('local');
      SessionStorageStore = StorageStore('session');
    });

    it('proxies its methods directly to the wrapper', function* () {
      LocalStorageStore.set();
      sinon.assert.calledOnce(stubs.setItem);

      LocalStorageStore.get();
      sinon.assert.calledOnce(stubs.getItem);

      LocalStorageStore.remove();
      sinon.assert.calledOnce(stubs.removeItem);

      SessionStorageStore.set();
      sinon.assert.calledTwice(stubs.setItem);

      SessionStorageStore.get();
      sinon.assert.calledTwice(stubs.getItem);

      SessionStorageStore.remove();
      sinon.assert.calledTwice(stubs.removeItem);
    });

    describe('#isSupported', function () {
      beforeEach(function () {
        LocalStorageStore.set = sinon.stub();
        SessionStorageStore.set = sinon.stub();
      });

      it('returns true when StorageStore.set does not throw', function () {
        LocalStorageStore.set.returns(undefined);
        SessionStorageStore.set.returns(undefined);

        expect(LocalStorageStore.isSupported()).toEqual(true);
        expect(SessionStorageStore.isSupported()).toEqual(true);

        sinon.assert.calledOnce(LocalStorageStore.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(SessionStorageStore.set.withArgs('test', {test: true}));
      });

      it('returns false when StorageStore.set does throw', function () {
        LocalStorageStore.set.throws('TypeError');
        SessionStorageStore.set.throws('TypeError');

        expect(LocalStorageStore.isSupported()).toEqual(false);
        expect(SessionStorageStore.isSupported()).toEqual(false);

        sinon.assert.calledOnce(LocalStorageStore.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(SessionStorageStore.set.withArgs('test', {test: true}));
      });

      it('removes test key after successful test', function () {
        LocalStorageStore.remove = sinon.stub();
        LocalStorageStore.set.returns(undefined);
        LocalStorageStore.isSupported();

        sinon.assert.calledOnce(LocalStorageStore.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(LocalStorageStore.remove.withArgs('test'));
      });
    });
  });

  describe('utils/TheStore/CookieStore', function () {
    const stubs = {};
    const config = {
      default: {
        env: {
          env: null
        }
      }
    };

    let system;
    let CookieStore;

    function testSecureCookie (method, mode, expected) {
      const stub = stubs[method];

      config.default.env = mode;

      // This is somewhat duplicated, but it is more clear
      if (method === 'remove') {
        CookieStore.remove('test');
        sinon.assert.calledOnce(stub.withArgs('test'));
        expect(stub.firstCall.args[1].secure).toEqual(expected);
      } else if (method === 'set') {
        CookieStore.set('test', 'test');
        sinon.assert.calledOnce(stub.withArgs('test', 'test'));
        expect(stub.firstCall.args[2].secure).toEqual(expected);
      }
    }

    beforeEach(function* () {
      stubs.set = sinon.stub();
      stubs.get = sinon.stub();
      stubs.remove = sinon.stub();

      system = createIsolatedSystem();

      system.set('Cookies', {
        default: {
          set: stubs.set,
          get: stubs.get,
          remove: stubs.remove
        }
      });

      system.set('environment', config);

      CookieStore = yield system.import('utils/TheStore/CookieStore');
    });

    it('exposes an API that proxies to the backing Cookies storage', function () {
      ['set', 'get', 'remove'].forEach((method) => {
        expect(typeof CookieStore[method]).toEqual('function');
      });
    });

    it('proxies to the Cookies storage directly', function () {
      ['set', 'get', 'remove'].forEach(method => {
        CookieStore[method]();

        sinon.assert.calledOnce(stubs[method]);
      });
    });

    it('exposes a type that directly states it is the CookieStore', function () {
      expect(CookieStore.type).toBe('CookieStore');
    });

    describe('#set', function () {
      it('uses non-secure cookie for dev mode', function () {
        testSecureCookie('set', 'development', false);
      });

      it('uses secure cookie otherwise', function () {
        testSecureCookie('set', 'production', true);
      });

      it('expires in distant future', function () {
        CookieStore.set('test', 'test');

        sinon.assert.calledOnce(stubs.set.withArgs('test', 'test'));
        expect(stubs.set.firstCall.args[2].expires).toEqual(365);
      });
    });

    describe('#remove', function () {
      it('uses non-secure cookie for dev mode', function () {
        testSecureCookie('remove', 'development', false);
      });

      it('uses secure cookie otherwise', function () {
        testSecureCookie('remove', 'production', true);
      });
    });
  });
});
