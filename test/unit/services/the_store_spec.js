describe('The Store service', function () {
  beforeEach(function () {
    const addEventListener = sinon.stub();
    const removeEventListener = sinon.stub();

    module('contentful/test', function ($provide) {
      $provide.constant('Cookies', { set: _.noop, get: _.noop, remove: _.noop });
      $provide.value('$window', { addEventListener, removeEventListener });
    });

    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
  });

  function testApi (api, store, storage) {
    Object.keys(api).forEach(function (method) {
      const methodStub = sinon.stub(storage, api[method]);
      expect(typeof store[method]).toEqual('function');
      store[method]();
      sinon.assert.calledOnce(methodStub);
    });
  }

  describe('localStorageWrapper', function () {
    it('exposes simplified localStorage API', function () {
      // The service is mocked by default. We need to fetch the
      // original implementation.
      const wrapper = this.$inject('TheStore/localStorageWrapper')._noMock;
      ['setItem', 'getItem', 'removeItem'].forEach(function (method) {
        expect(typeof wrapper[method]).toEqual('function');
      });
    });
  });

  describe('localStorageStore', function () {
    beforeEach(function () {
      this.localStorageStore = this.$inject('TheStore/localStorageStore');
      this.storage = this.$inject('TheStore/localStorageWrapper');
    });

    it('exposes API proxying to storage', function () {
      const api = { set: 'setItem', get: 'getItem', remove: 'removeItem' };
      testApi(api, this.localStorageStore, this.storage);
    });

    describe('#isSupported', function () {
      beforeEach(function () {
        this.setStub = sinon.stub(this.storage, 'setItem');
      });

      it('returns true when set on localStorage does not throw', function () {
        this.setStub.returns(undefined);
        expect(this.localStorageStore.isSupported()).toEqual(true);
        sinon.assert.calledOnce(this.setStub.withArgs('test', {test: true}));
      });

      it('returns false when set on localStorage throws error', function () {
        this.setStub.throws('TypeError');
        expect(this.localStorageStore.isSupported()).toEqual(false);
        sinon.assert.calledOnce(this.setStub.withArgs('test', {test: true}));
      });

      it('removes test key after successful test', function () {
        const removeStub = sinon.stub(this.storage, 'removeItem');
        this.setStub.returns(undefined);
        this.localStorageStore.isSupported();
        sinon.assert.calledOnce(this.setStub.withArgs('test', {test: true}));
        sinon.assert.calledOnce(removeStub.withArgs('test'));
      });
    });
  });

  describe('cookieStore', function () {
    beforeEach(function () {
      this.cookieStore = this.$inject('TheStore/cookieStore');
      this.storage = this.$inject('Cookies');
      this.config = this.$inject('environment');
    });

    it('exposes API proxying to storage', function () {
      const api = {set: 'set', get: 'get', remove: 'remove'};
      testApi(api, this.cookieStore, this.storage);
    });

    describe('#set', function () {
      beforeEach(function () {
        this.setStub = sinon.stub(this.storage, 'set');

        this.testSecureCookie = function (mode, expected) {
          this.config.env = mode;
          this.cookieStore.set('test', 'test');
          sinon.assert.calledOnce(this.setStub.withArgs('test', 'test'));
          expect(this.setStub.firstCall.args[2].secure).toEqual(expected);
        };
      });


      it('uses non-secure cookie for dev mode', function () {
        this.testSecureCookie('development', false);
      });

      it('uses secure cookie otherwise', function () {
        this.testSecureCookie('production', true);
      });

      it('expires in distant future', function () {
        this.cookieStore.set('test', 'test');
        sinon.assert.calledOnce(this.setStub.withArgs('test', 'test'));
        expect(this.setStub.firstCall.args[2].expires).toEqual(365);
      });
    });

    describe('#remove', function () {
      beforeEach(function () {
        this.removeStub = sinon.stub(this.storage, 'remove');

        this.testSecureCookie = function (mode, expected) {
          this.config.env = mode;
          this.cookieStore.remove('test');
          sinon.assert.calledOnce(this.removeStub.withArgs('test'));
          expect(this.removeStub.firstCall.args[1].secure).toEqual(expected);
        };
      });

      it('uses non-secure cookie for dev mode', function () {
        this.testSecureCookie('development', false);
      });

      it('uses secure cookie otherwise', function () {
        this.testSecureCookie('production', true);
      });
    });
  });

  describe('TheStore', function () {
    const primitives = { '1': 1, '1.1': 1.1, 'true': true, 'null': null };

    beforeEach(function () {
      this.localStorageStore = this.$inject('TheStore/localStorageStore');
      sinon.stub(this.localStorageStore, 'isSupported').returns(true);
      this.TheStore = this.$inject('TheStore');
    });

    describe('#set', function () {
      beforeEach(function () {
        this.setStub = sinon.stub(this.localStorageStore, 'set');
      });

      it('stores string as is', function () {
        this.TheStore.set('test', 'test-string');
        sinon.assert.calledOnce(this.setStub.withArgs('test', 'test-string'));
      });

      it('stores primitives stringified', function () {
        Object.keys(primitives).forEach((str) => {
          this.TheStore.set('test', primitives[str]);
          sinon.assert.called(this.setStub.withArgs('test', str));
        });
      });

      it('stores objects stringified', function () {
        this.TheStore.set('test', {test: true});
        sinon.assert.calledOnce(this.setStub.withArgs('test', '{"test":true}'));
      });
    });

    describe('#get', function () {
      beforeEach(function () {
        this.getStub = sinon.stub(this.localStorageStore, 'get');
      });

      it('returns null for non-existent value', function () {
        this.getStub.returns(null);
        expect(this.TheStore.get('non-existent')).toEqual(null);
      });

      it('returns string as is', function () {
        this.getStub.returns('test-string');
        expect(this.TheStore.get('test')).toEqual('test-string');
      });

      it('returns primitives parsed', function () {
        Object.keys(primitives).forEach((str) => {
          this.getStub.returns(str);
          expect(this.TheStore.get('test')).toEqual(primitives[str]);
        });
      });

      it('returns objects parsed', function () {
        this.getStub.returns('{"test":true}');
        expect(this.TheStore.get('test')).toEqual({test: true});
      });
    });

    describe('#remove', function () {
      it('proxies to underlying remove function', function () {
        const stub = sinon.stub(this.localStorageStore, 'remove');
        this.TheStore.remove('test');
        sinon.assert.calledOnce(stub.withArgs('test'));
      });
    });

    describe('#has', function () {
      it('returns bool depending on #get result', function () {
        const stub = sinon.stub(this.localStorageStore, 'get');
        stub.returns('test-string');
        expect(this.TheStore.has('test')).toEqual(true);
        sinon.assert.called(stub.withArgs('test'));
        stub.returns(null);
        expect(this.TheStore.has('non-existent')).toEqual(false);
        sinon.assert.called(stub.withArgs('non-existent'));
      });
    });

    describe('#externalChanges', function () {
      it('emits value on `storage` window event', function () {
        this.TheStore.set('mykey', 'initial');
        const changes$ = this.TheStore.externalChanges('mykey');
        const emittedChange = sinon.stub();
        changes$.onValue(emittedChange);
        this.addEventListener.withArgs('storage').yield({key: 'mykey', newValue: 'newvalue'});
        sinon.assert.calledOnceWith(emittedChange, 'newvalue');
      });
    });
  });
});
