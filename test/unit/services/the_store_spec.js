'use strict';

describe('The Store service', function() {

  beforeEach(function() {
    module('contentful/test');
    module(function($provide) {
      $provide.constant('Cookies', { set: _.noop, get: _.noop, remove: _.noop });
    });
  });

  function testApi(api, store, storage) {
    Object.keys(api).forEach(function(method) {
      var methodStub = sinon.stub(storage, api[method]);
      expect(typeof store[method]).toEqual('function');
      store[method]();
      sinon.assert.calledOnce(methodStub);
    });
  }

  describe('localStorageWrapper', function() {
    it('exposes simplified localStorage API', function() {
      var wrapper = this.$inject('TheStore/localStorageWrapper');
      ['setItem', 'getItem', 'removeItem'].forEach(function(method) {
        expect(typeof wrapper[method]).toEqual('function');
      });
    });
  });

  describe('localStorageStore', function() {
    var localStorageStore, storage;
    beforeEach(function () {
      localStorageStore = this.$inject('TheStore/localStorageStore');
      storage = this.$inject('TheStore/localStorageWrapper');
    });

    it('exposes API proxying to storage', function() {
      var api = { set: 'setItem', get: 'getItem', remove: 'removeItem'};
      testApi(api, localStorageStore, storage);
    });

    describe('#isSupported', function () {
      var setStub;
      beforeEach(function () {
        setStub = sinon.stub(storage, 'setItem');
      });

      it('returns true when set on localStorage does not throw', function () {
        setStub.returns(undefined);
        expect(localStorageStore.isSupported()).toEqual(true);
        sinon.assert.calledOnce(setStub.withArgs('test', {test: true}));
      });

      it('returns false when set on localStorage throws error', function () {
        setStub.throws('TypeError');
        expect(localStorageStore.isSupported()).toEqual(false);
        sinon.assert.calledOnce(setStub.withArgs('test', {test: true}));
      });

      it('removes test key after successful test', function () {
        var removeStub = sinon.stub(storage, 'removeItem');
        setStub.returns(undefined);
        localStorageStore.isSupported();
        sinon.assert.calledOnce(setStub.withArgs('test', {test: true}));
        sinon.assert.calledOnce(removeStub.withArgs('test'));
      });
    });
  });

  describe('cookieStore', function () {
    var cookieStore, storage, config;
    beforeEach(function () {
      cookieStore = this.$inject('TheStore/cookieStore');
      storage = this.$inject('Cookies');
      config = this.$inject('environment');
    });

    it('exposes API proxying to storage', function () {
      var api = {set: 'set', get: 'get', remove: 'remove'};
      testApi(api, cookieStore, storage);
    });

    describe('#set', function () {
      var setStub;
      beforeEach(function () {
        setStub = sinon.stub(storage, 'set');
      });

      function testSecureCookie(mode, expected) {
        config.env = mode;
        cookieStore.set('test', 'test');
        sinon.assert.calledOnce(setStub.withArgs('test', 'test'));
        expect(setStub.firstCall.args[2].secure).toEqual(expected);
      }

      it('uses non-secure cookie for dev mode', function () {
        testSecureCookie('development', false);
      });

      it('uses secure cookie otherwise', function () {
        testSecureCookie('production', true);
      });

      it('expires in distant future', function() {
        cookieStore.set('test', 'test');
        sinon.assert.calledOnce(setStub.withArgs('test', 'test'));
        expect(setStub.firstCall.args[2].expires).toEqual(365);
      });
    });

    describe('#remove', function () {
      var removeStub;
      beforeEach(function () {
        removeStub = sinon.stub(storage, 'remove');
      });

      function testSecureCookie(mode, expected) {
        config.env = mode;
        cookieStore.remove('test');
        sinon.assert.calledOnce(removeStub.withArgs('test'));
        expect(removeStub.firstCall.args[1].secure).toEqual(expected);
      }

      it('uses non-secure cookie for dev mode', function () {
        testSecureCookie('development', false);
      });

      it('uses secure cookie otherwise', function () {
        testSecureCookie('production', true);
      });
    });
  });

  describe('TheStore', function () {
    var TheStore, localStorageStore;
    var primitives = { '1': 1, '1.1': 1.1, 'true': true, 'null': null };

    beforeEach(function () {
      localStorageStore = this.$inject('TheStore/localStorageStore');
      sinon.stub(localStorageStore, 'isSupported').returns(true);
      TheStore = this.$inject('TheStore');
    });

    describe('#set', function () {
      var setStub;
      beforeEach(function () {
        setStub = sinon.stub(localStorageStore, 'set');
      });

      it('stores string as is', function () {
        TheStore.set('test', 'test-string');
        sinon.assert.calledOnce(setStub.withArgs('test', 'test-string'));
      });

      it('stores primitives stringified', function () {
        Object.keys(primitives).forEach(function (str) {
          TheStore.set('test', primitives[str]);
          sinon.assert.called(setStub.withArgs('test', str));
        });
      });

      it('stores objects stringified', function () {
        TheStore.set('test', {test: true});
        sinon.assert.calledOnce(setStub.withArgs('test', '{"test":true}'));
      });
    });

    describe('#get', function () {
      var getStub;
      beforeEach(function () {
        getStub = sinon.stub(localStorageStore, 'get');
      });

      it('returns null for non-existent value', function () {
        getStub.returns(null);
        expect(TheStore.get('non-existent')).toEqual(null);
      });

      it('returns string as is', function () {
        getStub.returns('test-string');
        expect(TheStore.get('test')).toEqual('test-string');
      });

      it('returns primitives parsed', function () {
        Object.keys(primitives).forEach(function (str) {
          getStub.returns(str);
          expect(TheStore.get('test')).toEqual(primitives[str]);
        });
      });

      it('returns objects parsed', function () {
        getStub.returns('{"test":true}');
        expect(TheStore.get('test')).toEqual({test: true});
      });
    });

    describe('#remove', function () {
      it('proxies to underlying remove function', function () {
        var stub = sinon.stub(localStorageStore, 'remove');
        TheStore.remove('test');
        sinon.assert.calledOnce(stub.withArgs('test'));
      });
    });

    describe('#has', function () {
      it('returns bool depending on #get result', function () {
        var stub = sinon.stub(localStorageStore, 'get');
        stub.returns('test-string');
        expect(TheStore.has('test')).toEqual(true);
        sinon.assert.called(stub.withArgs('test'));
        stub.returns(null);
        expect(TheStore.has('non-existent')).toEqual(false);
        sinon.assert.called(stub.withArgs('non-existent'));
      });
    });
  });
});
