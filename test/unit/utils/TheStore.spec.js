import { createIsolatedSystem } from 'test/helpers/system-js';

describe('TheStore', () => {
  beforeEach(async function() {
    this.primitives = {
      '1': 1,
      '1.1': 1.1,
      true: true,
      null: null
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

    this.localStorage = {
      setItem: sinon.stub(),
      getItem: sinon.stub(),
      removeItem: sinon.stub()
    };

    this.sessionStorage = {
      setItem: sinon.stub(),
      getItem: sinon.stub(),
      removeItem: sinon.stub()
    };

    this.system = createIsolatedSystem();

    this.system.set('global/window', {
      default: {
        addEventListener: this.listeners.addEventListener,
        removeEventListener: this.listeners.removeEventListener,
        localStorage: this.localStorage,
        sessionStorage: this.sessionStorage
      }
    });

    this.storeUtils = await this.system.import('TheStore/Utils.es6');
    this.getStore = (await this.system.import('TheStore/index.es6')).getStore;
    this.ClientStorageWrapper = (await this.system.import(
      'TheStore/ClientStorageWrapper.es6'
    )).default;
    this.ClientStorage = (await this.system.import('TheStore/ClientStorage.es6')).default;
  });

  describe('#getStore', () => {
    it('should return the default local storage if called with no arguments', function() {
      const local = this.getStore();

      local.set('localKey', 'localValue');
      expect(this.localStorage.setItem.callCount).toBe(1);
    });

    it('should return the storage based on given argument', function() {
      const local = this.getStore('local');
      const session = this.getStore('session');

      // Test localStorage
      local.set('localKey', 'localValue');
      expect(this.localStorage.setItem.callCount).toBe(1);

      // Test sessionStorage
      session.set('sessionKey', 'sessionValue');
      expect(this.sessionStorage.setItem.callCount).toBe(1);
    });
  });

  describe('utils', () => {
    describe('#set', () => {
      it('stores string as is', function() {
        this.storeUtils.set(this.storage, 'test', 'test-string');

        sinon.assert.calledOnce(this.storage.set.withArgs('test', 'test-string'));
      });

      it('stores primitives stringified', function() {
        Object.keys(this.primitives).forEach(str => {
          this.storeUtils.set(this.storage, 'test', this.primitives[str]);
          sinon.assert.called(this.storage.set.withArgs('test', str));
        });
      });

      it('stores objects stringified', function() {
        this.storeUtils.set(this.storage, 'test', { test: true });
        sinon.assert.calledOnce(this.storage.set.withArgs('test', '{"test":true}'));
      });
    });

    describe('#get', () => {
      it('returns null for non-existent value', function() {
        this.storage.get.returns(null);
        expect(this.storeUtils.get(this.storage, 'non-existent')).toEqual(null);
      });

      it('returns string as is', function() {
        this.storage.get.returns('test-string');
        expect(this.storeUtils.get(this.storage, 'test')).toEqual('test-string');
      });

      it('returns primitives parsed', function() {
        Object.keys(this.primitives).forEach(str => {
          this.storage.get.returns(str);
          expect(this.storeUtils.get(this.storage, 'test')).toEqual(this.primitives[str]);
        });
      });

      it('returns objects parsed', function() {
        this.storage.get.returns('{"test":true}');
        expect(this.storeUtils.get(this.storage, 'test')).toEqual({ test: true });
      });
    });

    describe('#remove', () => {
      it('proxies to underlying remove function', function() {
        this.storeUtils.remove(this.storage, 'test');
        sinon.assert.calledOnce(this.storage.remove.withArgs('test'));
      });
    });

    describe('#has', () => {
      it('returns bool depending on #get result', function() {
        this.storage.get.returns('test-string');
        expect(this.storeUtils.has(this.storage, 'test')).toEqual(true);
        sinon.assert.called(this.storage.get.withArgs('test'));

        this.storage.get.returns(null);
        expect(this.storeUtils.has(this.storage, 'non-existent')).toEqual(false);
        sinon.assert.called(this.storage.get.withArgs('non-existent'));
      });
    });

    describe('#externalChanges', () => {
      it('emits value on `storage` window event after setting in localthis. storage', function() {
        this.storeUtils.set(this.storage, 'mykey', 'initial');

        const changes$ = this.storeUtils.externalChanges('mykey');
        const emittedChange = sinon.stub();

        changes$.onValue(emittedChange);

        this.listeners.addEventListener
          .withArgs('storage')
          .yield({ key: 'mykey', newValue: 'newvalue' });
        sinon.assert.calledOnceWith(emittedChange, 'newvalue');
      });
    });
  });

  describe('TheStore/ClientStorageWrapper.es6', () => {
    beforeEach(function() {
      this.SessionStorageWrapper = this.ClientStorageWrapper('session');
      this.LocalStorageWrapper = this.ClientStorageWrapper('local');
    });

    it('exposes a simplified Local/Session Storage API', function() {
      [this.LocalStorageWrapper, this.SessionStorageWrapper].forEach(wrapper => {
        ['setItem', 'getItem', 'removeItem'].forEach(method => {
          expect(typeof wrapper[method]).toEqual('function');
        });
      });
    });
  });

  describe('TheStore/StorageStore', () => {
    beforeEach(function() {
      this.ClientStorageLocal = this.ClientStorage('local');
      this.ClientStorageSession = this.ClientStorage('session');
    });

    it('proxies its methods directly to the wrapper', function() {
      this.ClientStorageLocal.set();
      sinon.assert.calledOnce(this.localStorage.setItem);

      this.ClientStorageLocal.get();
      sinon.assert.calledOnce(this.localStorage.getItem);

      this.ClientStorageLocal.remove();
      sinon.assert.calledOnce(this.localStorage.removeItem);

      this.ClientStorageSession.set();
      sinon.assert.calledOnce(this.sessionStorage.setItem);

      this.ClientStorageSession.get();
      sinon.assert.calledOnce(this.sessionStorage.getItem);

      this.ClientStorageSession.remove();
      sinon.assert.calledOnce(this.sessionStorage.removeItem);
    });
  });
});
