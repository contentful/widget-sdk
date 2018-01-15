/* global window */

import ClientStorageWrapper from 'TheStore/ClientStorageWrapper';
import { getStore } from 'TheStore';

import { createIsolatedSystem } from 'test/helpers/system-js';

describe('TheStore', function () {
  describe('#getStore', function () {
    it('should return the default local storage if called with no arguments', function () {
      expect(getStore().type).toBe('LocalStorage');
    });

    it('should return the specified storage type if requested', function () {
      expect(getStore('local').type).toBe('LocalStorage');
      expect(getStore('session').type).toBe('SessionStorage');
      expect(getStore('cookie').type).toBe('CookieStorage');
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

      storeUtils = yield system.import('TheStore/Utils');
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


  describe('TheStore/ClientStorageWrapper', function () {
    let SessionStorageWrapper;
    let LocalStorageWrapper;

    beforeEach(function () {
      SessionStorageWrapper = ClientStorageWrapper('session');
      LocalStorageWrapper = ClientStorageWrapper('local');
    });

    it('exposes a simplified Local/Session Storage API', function () {
      [ LocalStorageWrapper, SessionStorageWrapper ].forEach(function (wrapper) {
        ['setItem', 'getItem', 'removeItem'].forEach(function (method) {
          expect(typeof wrapper[method]).toEqual('function');
        });
      });
    });
  });

  describe('TheStore/StorageStore', function () {
    const stubs = {};
    let system;
    let ClientStorage;
    let LocalStorage;
    let SessionStorage;

    beforeEach(function* () {
      stubs.setItem = sinon.stub();
      stubs.getItem = sinon.stub();
      stubs.removeItem = sinon.stub();

      system = createIsolatedSystem();

      system.set('TheStore/ClientStorageWrapper', {
        default: function () {
          return {
            setItem: stubs.setItem,
            getItem: stubs.getItem,
            removeItem: stubs.removeItem
          };
        }
      });

      ClientStorage = (yield system.import('TheStore/ClientStorage')).default;

      LocalStorage = ClientStorage('local');
      SessionStorage = ClientStorage('session');
    });

    it('proxies its methods directly to the wrapper', function* () {
      LocalStorage.set();
      sinon.assert.calledOnce(stubs.setItem);

      LocalStorage.get();
      sinon.assert.calledOnce(stubs.getItem);

      LocalStorage.remove();
      sinon.assert.calledOnce(stubs.removeItem);

      SessionStorage.set();
      sinon.assert.calledTwice(stubs.setItem);

      SessionStorage.get();
      sinon.assert.calledTwice(stubs.getItem);

      SessionStorage.remove();
      sinon.assert.calledTwice(stubs.removeItem);
    });

    describe('#isSupported', function () {
      beforeEach(function () {
        LocalStorage.set = sinon.stub();
        SessionStorage.set = sinon.stub();
      });

      it('returns true when StorageStore.set does not throw', function () {
        LocalStorage.set.returns(undefined);
        SessionStorage.set.returns(undefined);

        expect(LocalStorage.isSupported()).toEqual(true);
        expect(SessionStorage.isSupported()).toEqual(true);

        sinon.assert.calledOnce(LocalStorage.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(SessionStorage.set.withArgs('test', {test: true}));
      });

      it('returns false when StorageStore.set does throw', function () {
        LocalStorage.set.throws('TypeError');
        SessionStorage.set.throws('TypeError');

        expect(LocalStorage.isSupported()).toEqual(false);
        expect(SessionStorage.isSupported()).toEqual(false);

        sinon.assert.calledOnce(LocalStorage.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(SessionStorage.set.withArgs('test', {test: true}));
      });

      it('removes test key after successful test', function () {
        LocalStorage.remove = sinon.stub();
        LocalStorage.set.returns(undefined);
        LocalStorage.isSupported();

        sinon.assert.calledOnce(LocalStorage.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(LocalStorage.remove.withArgs('test'));
      });
    });
  });

  describe('TheStore/CookieStorage', function () {
    const stubs = {};
    const config = {
      default: {
        env: {
          env: null
        }
      }
    };

    let system;
    let CookieStorage;

    function testSecureCookie (method, mode, expected) {
      const stub = stubs[method];

      config.default.env = mode;

      // This is somewhat duplicated, but it is more clear
      if (method === 'remove') {
        CookieStorage.remove('test');
        sinon.assert.calledOnce(stub.withArgs('test'));
        expect(stub.firstCall.args[1].secure).toEqual(expected);
      } else if (method === 'set') {
        CookieStorage.set('test', 'test');
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

      CookieStorage = yield system.import('TheStore/CookieStorage');
    });

    it('exposes an API that proxies to the backing Cookies storage', function () {
      ['set', 'get', 'remove'].forEach((method) => {
        expect(typeof CookieStorage[method]).toEqual('function');
      });
    });

    it('proxies to the Cookies storage directly', function () {
      ['set', 'get', 'remove'].forEach(method => {
        CookieStorage[method]();

        sinon.assert.calledOnce(stubs[method]);
      });
    });

    it('exposes a type that directly states it is the CookieStorage', function () {
      expect(CookieStorage.type).toBe('CookieStorage');
    });

    describe('#set', function () {
      it('uses non-secure cookie for dev mode', function () {
        testSecureCookie('set', 'development', false);
      });

      it('uses secure cookie otherwise', function () {
        testSecureCookie('set', 'production', true);
      });

      it('expires in distant future', function () {
        CookieStorage.set('test', 'test');

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
