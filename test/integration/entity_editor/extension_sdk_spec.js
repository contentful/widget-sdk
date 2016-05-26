'use strict';

describe('Extension SDK', function () {
  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    const widgets = this.$inject('widgets');
    widgets.get = sinon.stub().returns({
      srcdoc:
        '<!doctype html>' +
        '<script src="/base/vendor/contentful-widget-sdk/dist/cf-widget-api.js"></script>'
    });

    const spaceContext = this.$inject('spaceContext');
    spaceContext.space = { data: {sys: {}} };

    this.apiClient = {};
    spaceContext.cma = this.apiClient;

    this.container = $('<div>').appendTo('body');

    const field = {
      id: 'FID-internal',
      apiName: 'FID',
      type: 'Text'
    };


    this.scope = {
      widget: {},
      contentType: {
        data: {
          fields: [field]
        }
      },
      entry: {
        data: {
          sys: {},
          fields: {}
        }
      },
      field: field,
      locale: {
        code: 'de',
        internal_code: 'de-internal'
      },
      otDoc: {
        setValueAt: sinon.stub().resolves(true),
        removeValueAt: sinon.stub().resolves(true)
      },
      fieldLocale: {
        access: {
          disabled: false
        }
      },
      fieldController: {
        setInvalid: sinon.spy()
      }
    };


    this.loadApi = () => {
      return new Promise((resolve, reject) => {
        const el = this.$compile('<cf-iframe-widget>', this.scope);
        this.scope = el.scope();
        const iframe = el.find('iframe')[0];
        iframe.removeAttribute('sandbox');
        iframe.addEventListener('load', () => {
          try {
            const w = iframe.contentWindow;
            w.console = window.console;
            w.contentfulWidget.init(resolve);
          } catch (e) {
            reject(e);
          }
        });
        el.appendTo(this.container);
      });
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  const it = makeApiTestDescriptor(window.it);

  describe('#field', function () {

    describe('#getValue()', function () {
      beforeEach(function () {
        this.scope.entry.data.fields['FID-internal'] = {'de-internal': 'INITIAL'};
        dotty.put(this.scope.entry.data, ['fields', 'FID-internal', 'de-internal'], 'INITIAL');
      });

      it('gets initial value', function* (api) {
        expect(api.field.getValue()).toEqual('INITIAL');
      });

      it('gets updated value after otChange event is fired', function* (api, scope) {
        emitOtChange(scope, ['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield;
        expect(api.field.getValue()).toEqual('VALUE');
      });
    });

    describe('#onValueChanged()', function () {
      it('calls callback after otChange event is fired', function* (api, scope) {
        const valueChanged = sinon.stub();
        api.field.onValueChanged(valueChanged);
        valueChanged.reset();
        emitOtChange(scope, ['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield;
        sinon.assert.calledOnce(valueChanged);
        sinon.assert.calledWithExactly(valueChanged, 'VALUE');
      });

      it('does not call callback after detaching', function* (api, scope) {
        const valueChanged = sinon.stub();
        // We make sure that it is called once in order to prevent
        // errors when the event is not dispatched at all.
        api.field.onValueChanged(valueChanged);

        const detach = api.field.onValueChanged(valueChanged);
        valueChanged.reset();
        detach();
        emitOtChange(scope, ['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield;
        sinon.assert.calledOnce(valueChanged);
      });

      it('does not call callback in the window that called setValue', function* (api) {
        const valueChanged = sinon.spy();
        api.field.onValueChanged(valueChanged);
        valueChanged.reset();
        api.field.setValue('VALUE');
        yield;
        sinon.assert.notCalled(valueChanged);
      });

      it('calls callback with most recently dispatched value', function* (api, scope) {
        const valueChanged = sinon.spy();
        emitOtChange(scope, ['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield;
        api.field.onValueChanged(valueChanged);
        sinon.assert.calledOnce(valueChanged);
        sinon.assert.calledWithExactly(valueChanged, 'VALUE');
      });
    });

    describe('#onIsDisabledChanged', function () {
      it('calls callback when disable status of field is changed', function* (api, scope) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged);
        yield;
        isDisabledChanged.reset();
        scope.fieldLocale.access.disabled = true;
        yield;
        sinon.assert.calledOnce(isDisabledChanged);
        sinon.assert.calledWithExactly(isDisabledChanged, true);
      });

      it('does not call callback after detaching', function* (api, scope) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged)(); // detach the listener
        yield;
        isDisabledChanged.reset();
        scope.fieldLocale.access.disabled = true;
        yield;
        sinon.assert.notCalled(isDisabledChanged);
      });
    });

    describe('#setValue()', function () {
      testValueMethods('setValue', 'VAL');
    });

    describe('#removeValue()', function () {
      testValueMethods('removeValue');
    });

    describe('#setInvalid', function () {
      it('proxies call to setInvalid method on scope.fieldController', function* (api, scope) {
        api.field.setInvalid(true, scope.locale.code);
        yield;
        sinon.assert.calledWithExactly(scope.fieldController.setInvalid, scope.locale.code, true);
      });
    });

    function testValueMethods (method, value) {
      it(`calls "otDoc.${method}At()" with current field path`, function* (api, scope) {
        if (_.isUndefined(value)) {
          yield api.field[method]();
          sinon.assert.calledWith(scope.otDoc[`${method}At`], ['fields', 'FID-internal', 'de-internal']);
        } else {
          yield api.field[method](value);
          sinon.assert.calledWith(scope.otDoc[`${method}At`], ['fields', 'FID-internal', 'de-internal'], value);
        }
      });

      it('resolves', function* (api) {
        const success = sinon.stub();
        yield api.field[method](value).then(success);
        sinon.assert.called(success);
      });

      it(`rejects when "otDoc.${method}At()" fails`, function* (api, scope) {
        scope.otDoc[`${method}At`].rejects();
        const errored = sinon.stub();
        yield api.field[method](value).catch(errored);
        sinon.assert.calledWith(errored);
      });
    }
  });

  describe('#entry', function () {
    const SYS_0 = 'initial sys value';
    const SYS_1 = 'new sys value';

    beforeEach(function () {
      this.scope.entry.data.sys = SYS_0;
    });

    describe('#getSys()', function () {
      it('returns the initial sys object', function* (api) {
        const sys = api.entry.getSys();
        expect(sys).toEqual(SYS_0);
      });

      it('returns updated value when scope property changes', function* (api) {
        expect(api.entry.getSys()).toEqual(SYS_0);
        this.scope.entry.data.sys = SYS_1;
        yield;
        expect(api.entry.getSys()).toEqual(SYS_1);
      });
    });

    describe('#onSysChanged()', function () {
      // TODO Not correctly implemented yet
      xit('calls listener with initial value', function* (api) {
        const listener = sinon.stub();
        api.entry.onSysChanged(listener);
        sinon.assert.calledWith(listener, SYS_0);
      });

      it('calls listener when scope property changes', function* (api) {
        const listener = sinon.stub();
        api.entry.onSysChanged(listener);
        listener.reset();
        this.scope.entry.data.sys = SYS_1;
        yield;
        sinon.assert.calledWith(listener, SYS_1);
      });
    });
  });

  describe('#fields', function () {
    beforeEach(function () {
      this.scope.contentType.data.fields = [
        this.scope.field,
        {id: 'f2-internal', apiName: 'f2', localized: true},
        {id: 'f3-internal', apiName: 'f3', localized: false}
      ];

      this.scope.entry.data.fields = {
        'f2-internal': {
          'en-internal': 'INITIAL en',
          'de-internal': 'INITIAL de'
        }
      };
    });

    it('has #id property', function* (api) {
      expect(api.entry.fields.f2.id).toEqual('f2');
    });

    it('has #locales property for localized field', function* (api) {
      expect(api.entry.fields.f2.locales).toEqual(['en', 'de']);
    });

    it('has #locales property for non-localized field', function* (api) {
      expect(api.entry.fields.f3.locales).toEqual(['en']);
    });

    describe('#getValue()', function () {
      it('returns initial value', function* (api) {
        expect(api.entry.fields.f2.getValue()).toEqual('INITIAL en');
        expect(api.entry.fields.f2.getValue('de')).toEqual('INITIAL de');
      });

      it('returns updated value after otChange event', function* (api, scope) {
        emitOtChange(scope, ['fields', 'f2-internal', 'en'], 'VAL en');
        yield;
        expect(api.entry.fields.f2.getValue()).toEqual('VAL en');

        emitOtChange(scope, ['fields', 'f2-internal', 'de', 5], 'VAL de');
        yield;
        expect(api.entry.fields.f2.getValue('de')).toEqual('VAL de');
      });
    });

    describe('#setValue()', function () {
      it('calls "otDoc.setValueAt()" with current field path', function* (api, scope) {
        const field = api.entry.fields.f2;
        yield field.setValue('VAL');
        sinon.assert.calledWith(scope.otDoc.setValueAt, ['fields', 'f2-internal', 'en-internal'], 'VAL');
        yield field.setValue('VAL', 'de');
        sinon.assert.calledWith(scope.otDoc.setValueAt, ['fields', 'f2-internal', 'de-internal'], 'VAL');
      });

      it('throws if locale is unknown', function* (api) {
        expect(() => {
          api.entry.fields.f2.setValue('VAL', 'unknown');
        }).toThrow();

        expect(() => {
          api.entry.fields.f3.setValue('VAL', 'de');
        }).toThrow();
      });

      it('resolves', function* (api) {
        const success = sinon.stub();
        yield api.entry.fields.f2.setValue('VAL').then(success);
        sinon.assert.calledWith(success);
      });

      it('rejects when "otDoc.setValueAt()" fails', function* (api, scope) {
        scope.otDoc.setValueAt.rejects();
        const errored = sinon.stub();
        yield api.entry.fields.f2.setValue('VAL').catch(errored);
        sinon.assert.calledWith(errored);
      });
    });
  });

  describe('#locales', function () {
    beforeEach(function () {
      const LocaleStore = this.$inject('TheLocaleStore');
      LocaleStore.setLocales([
        {code: 'en', internal_code: 'en-internal'},
        {code: 'de', internal_code: 'de-internal'}
      ]);
    });

    it('provides the default locale code', function* (api) {
      expect(api.locales.default).toEqual('en');
    });

    it('provides all available locales codes', function* (api) {
      expect(api.locales.available).toEqual(['en', 'de']);
    });
  });

  describe('#space methods', function () {
    it('delegates to API client and responds with data', function* (api) {
      for (let method of Object.keys(api.space)) {
        this.apiClient[method] = sinon.stub().resolves('DATA');
        const response = yield api.space[method]('X', 'Y');
        sinon.assert.calledOnce(this.apiClient[method]);
        sinon.assert.calledWithExactly(this.apiClient[method], 'X', 'Y');
        expect(response).toEqual('DATA');
      }
    });

    it('delegates to API and throws error', function* (api) {
      for (let method of Object.keys(api.space)) {
        this.apiClient[method] = sinon.stub().rejects({code: 'CODE', body: 'BODY'});
        const error = yield api.space[method]('X', 'Y').catch((e) => e);
        expect(error).toEqual({code: 'CODE', data: 'BODY', message: 'Request failed'});
      }
    });

    it('has a ApiClient method for each space method', function* (api) {
      const widgetApiMethods = Object.keys(api.space);
      const ApiClient = this.$inject('data/ApiClient');
      const cma = new ApiClient();
      for (let method of widgetApiMethods) {
        expect(typeof cma[method]).toBe('function');
      }
    });
  });


  function emitOtChange (scope, path, value) {
    const doc = {
      getAt: sinon.stub().withArgs(path).returns(value)
    };
    scope.$emit('otChange', doc, [{p: path}]);
  }


  function makeApiTestDescriptor (testFactory) {
    return function defineTest (desc, runner) {
      testFactory(desc, function (done) {
        const $apply = this.$apply.bind(this);
        this.loadApi()
        .then((api) => {
          const gen = runner.call(this, api, this.scope);
          return runGenerator(gen, $apply);
        })
        .then(done, done.fail);
      });
    };
  }


  function runGenerator (gen, $apply) {
    return new Promise((resolve, reject) => {
      const next = makeDispatcher('next');
      const throwTo = makeDispatcher('throw');

      next();

      function makeDispatcher (method) {
        return function (val) {
          let ret;
          try {
            ret = gen[method](val);
          } catch (e) {
            reject(e);
            return;
          }

          handleYield(ret);
        };
      }

      function handleYield (ret) {
        if (ret.done) {
          resolve();
          return;
        }

        if (ret.value) {
          ret.value.then(next, throwTo);
          $apply();
        } else {
          $apply();
          setTimeout(function () {
            next(ret.value);
          }, 4);
        }
      }
    });
  }
});
