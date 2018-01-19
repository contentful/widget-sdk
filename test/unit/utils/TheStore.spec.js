/* global window */

import ClientStorageWrapper from 'TheStore/ClientStorageWrapper';
import { getStore } from 'TheStore';
import { createIsolatedSystem } from 'test/helpers/system-js';

import Cookies from 'Cookies';

describe('TheStore', function () {
  describe('#getStore', function () {
    it('should return the default local storage if called with no arguments', function () {
      const local = getStore('local');

      local.set('localKey', 'localValue');
      expect(window.localStorage.getItem('localKey')).toBe('localValue');
    });

    it('should return the storage based on given argument', function () {
      const local = getStore('local');
      const session = getStore('session');
      const cookie = getStore('cookie');

      // Test localStorage
      local.set('localKey', 'localValue');
      expect(window.localStorage.getItem('localKey')).toBe('localValue');

      // Test sessionStorage
      session.set('sessionKey', 'sessionValue');
      expect(window.sessionStorage.getItem('sessionKey')).toBe('sessionValue');

      // Test cookies
      cookie.set('cookieKey', 'cookieValue');
      expect(Cookies.get('cookieKey')).toBe('cookieValue');
    });
  });

  describe('utils', function () {
    beforeEach(function* () {
      this.primitives = {
        '1': 1,
        '1.1': 1.1,
        'true': true,
        'null': null
      };

      this.storage = {
        set: sinon.stub(),
        get: sinon.stub(),
        remove: sinon.stub(),
        type: 'storage'
      };

      this.listeners = {
        addEventListener: sinon.stub(),
        removeEventListener: sinon.stub()
      };

      this.system = createIsolatedSystem();

      this.system.set('global/window', {
        default: {
          addEventListener: this.listeners.addEventListener,
          removeEventListener: this.listeners.removeEventListener
        }
      });

      this.storeUtils = yield this.system.import('TheStore/Utils');
    });

    describe('#set', function () {
      it('stores string as is', function () {
        this.storeUtils.set(this.storage, 'test', 'test-string');

        sinon.assert.calledOnce(this.storage.set.withArgs('test', 'test-string'));
      });

      it('stores primitives stringified', function () {
        Object.keys(this.primitives).forEach((str) => {
          this.storeUtils.set(this.storage, 'test', this.primitives[str]);
          sinon.assert.called(this.storage.set.withArgs('test', str));
        });
      });

      it('stores objects stringified', function () {
        this.storeUtils.set(this.storage, 'test', {test: true});
        sinon.assert.calledOnce(this.storage.set.withArgs('test', '{"test":true}'));
      });
    });

    describe('#get', function () {
      it('returns null for non-existent value', function () {
        this.storage.get.returns(null);
        expect(this.storeUtils.get(this.storage, 'non-existent')).toEqual(null);
      });

      it('returns string as is', function () {
        this.storage.get.returns('test-string');
        expect(this.storeUtils.get(this.storage, 'test')).toEqual('test-string');
      });

      it('returns primitives parsed', function () {
        Object.keys(this.primitives).forEach((str) => {
          this.storage.get.returns(str);
          expect(this.storeUtils.get(this.storage, 'test')).toEqual(this.primitives[str]);
        });
      });

      it('returns objects parsed', function () {
        this.storage.get.returns('{"test":true}');
        expect(this.storeUtils.get(this.storage, 'test')).toEqual({test: true});
      });
    });

    describe('#remove', function () {
      it('proxies to underlying remove function', function () {
        this.storeUtils.remove(this.storage, 'test');
        sinon.assert.calledOnce(this.storage.remove.withArgs('test'));
      });
    });

    describe('#has', function () {
      it('returns bool depending on #get result', function () {
        this.storage.get.returns('test-string');
        expect(this.storeUtils.has(this.storage, 'test')).toEqual(true);
        sinon.assert.called(this.storage.get.withArgs('test'));

        this.storage.get.returns(null);
        expect(this.storeUtils.has(this.storage, 'non-existent')).toEqual(false);
        sinon.assert.called(this.storage.get.withArgs('non-existent'));
      });
    });

    describe('#externalChanges', function () {
      it('emits value on `storage` window event after setting in localthis. storage', function () {
        this.storeUtils.set(this.storage, 'mykey', 'initial');

        const changes$ = this.storeUtils.externalChanges('mykey');
        const emittedChange = sinon.stub();

        changes$.onValue(emittedChange);

        this.listeners.addEventListener.withArgs('storage').yield({key: 'mykey', newValue: 'newvalue'});
        sinon.assert.calledOnceWith(emittedChange, 'newvalue');
      });
    });
  });


  describe('TheStore/ClientStorageWrapper', function () {
    beforeEach(function () {
      this.SessionStorageWrapper = ClientStorageWrapper('session');
      this.LocalStorageWrapper = ClientStorageWrapper('local');
    });

    it('exposes a simplified Local/Session Storage API', function () {
      [ this.LocalStorageWrapper, this.SessionStorageWrapper ].forEach(function (wrapper) {
        ['setItem', 'getItem', 'removeItem'].forEach(function (method) {
          expect(typeof wrapper[method]).toEqual('function');
        });
      });
    });
  });

  describe('TheStore/StorageStore', function () {
    beforeEach(function* () {
      this.stubs = {};

      this.stubs.setItem = sinon.stub();
      this.stubs.getItem = sinon.stub();
      this.stubs.removeItem = sinon.stub();

      this.system = createIsolatedSystem();

      this.system.set('TheStore/ClientStorageWrapper', {
        default: () => {
          return {
            setItem: this.stubs.setItem,
            getItem: this.stubs.getItem,
            removeItem: this.stubs.removeItem
          };
        }
      });

      this.ClientStorage = (yield this.system.import('TheStore/ClientStorage')).default;

      this.LocalStorage = this.ClientStorage('local');
      this.SessionStorage = this.ClientStorage('session');
    });

    it('proxies its methods directly to the wrapper', function* () {
      this.LocalStorage.set();
      sinon.assert.calledOnce(this.stubs.setItem);

      this.LocalStorage.get();
      sinon.assert.calledOnce(this.stubs.getItem);

      this.LocalStorage.remove();
      sinon.assert.calledOnce(this.stubs.removeItem);

      this.SessionStorage.set();
      sinon.assert.calledTwice(this.stubs.setItem);

      this.SessionStorage.get();
      sinon.assert.calledTwice(this.stubs.getItem);

      this.SessionStorage.remove();
      sinon.assert.calledTwice(this.stubs.removeItem);
    });

    describe('#isSupported', function () {
      beforeEach(function () {
        this.LocalStorage.set = sinon.stub();
        this.SessionStorage.set = sinon.stub();
      });

      it('returns true when StorageStore.set does not throw', function () {
        this.LocalStorage.set.returns(undefined);
        this.SessionStorage.set.returns(undefined);

        expect(this.LocalStorage.isSupported()).toEqual(true);
        expect(this.SessionStorage.isSupported()).toEqual(true);

        sinon.assert.calledOnce(this.LocalStorage.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(this.SessionStorage.set.withArgs('test', {test: true}));
      });

      it('returns false when StorageStore.set does throw', function () {
        this.LocalStorage.set.throws('TypeError');
        this.SessionStorage.set.throws('TypeError');

        expect(this.LocalStorage.isSupported()).toEqual(false);
        expect(this.SessionStorage.isSupported()).toEqual(false);

        sinon.assert.calledOnce(this.LocalStorage.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(this.SessionStorage.set.withArgs('test', {test: true}));
      });

      it('removes test key after successful test', function () {
        this.LocalStorage.remove = sinon.stub();
        this.LocalStorage.set.returns(undefined);
        this.LocalStorage.isSupported();

        sinon.assert.calledOnce(this.LocalStorage.set.withArgs('test', {test: true}));
        sinon.assert.calledOnce(this.LocalStorage.remove.withArgs('test'));
      });
    });
  });

  describe('TheStore/CookieStorage', function () {
    beforeEach(function* () {
      this.testSecureCookie = function (method, mode, expected) {
        const stub = this.stubs[method];

        this.config.default.env = mode;

        // This is somewhat duplicated, but it is more clear
        if (method === 'remove') {
          this.CookieStorage.remove('test');
          sinon.assert.calledOnce(stub.withArgs('test'));
          expect(stub.firstCall.args[1].secure).toEqual(expected);
        } else if (method === 'set') {
          this.CookieStorage.set('test', 'test');
          sinon.assert.calledOnce(stub.withArgs('test', 'test'));
          expect(stub.firstCall.args[2].secure).toEqual(expected);
        }
      };

      this.config = {
        default: {
          env: {
            env: null
          }
        }
      };

      this.stubs = {};
      this.stubs.set = sinon.stub();
      this.stubs.get = sinon.stub();
      this.stubs.remove = sinon.stub();

      this.system = createIsolatedSystem();

      this.system.set('Cookies', {
        default: {
          set: this.stubs.set,
          get: this.stubs.get,
          remove: this.stubs.remove
        }
      });

      this.system.set('environment', this.config);

      this.CookieStorage = yield this.system.import('TheStore/CookieStorage');
    });

    it('exposes an API that proxies to the backing Cookies storage', function () {
      ['set', 'get', 'remove'].forEach((method) => {
        expect(typeof this.CookieStorage[method]).toEqual('function');
      });
    });

    it('proxies to the Cookies storage directly', function () {
      ['set', 'get', 'remove'].forEach(method => {
        this.CookieStorage[method]();

        sinon.assert.calledOnce(this.stubs[method]);
      });
    });

    it('exposes a type that directly states it is the CookieStorage', function () {
      expect(this.CookieStorage.type).toBe('CookieStorage');
    });

    describe('#set', function () {
      it('uses non-secure cookie for dev mode', function () {
        this.testSecureCookie(this.stubs, 'set', 'development', false);
      });

      it('uses secure cookie otherwise', function () {
        this.testSecureCookie(this.stubs, 'set', 'production', true);
      });

      it('expires in distant future', function () {
        this.CookieStorage.set('test', 'test');

        sinon.assert.calledOnce(this.stubs.set.withArgs('test', 'test'));
        expect(this.stubs.set.firstCall.args[2].expires).toEqual(365);
      });
    });

    describe('#remove', function () {
      it('uses non-secure cookie for dev mode', function () {
        this.testSecureCookie('remove', 'development', false);
      });

      it('uses secure cookie otherwise', function () {
        this.testSecureCookie('remove', 'production', true);
      });
    });
  });
});
