import * as K from 'helpers/mocks/kefir';

describe('Extension SDK', function () {
  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    const widgets = this.$inject('widgets');
    widgets.get = sinon.stub().returns({
      srcdoc:
        '<!doctype html>' +
        '<script src="/base/vendor/ui-extensions-sdk/dist/cf-extension-api.js"></script>'
    });

    const spaceContext = this.$inject('spaceContext');
    spaceContext.space = { data: {
      sys: {},
      spaceMembership: {
        sys: {},
        user: {
          sys: {}
        },
        roles: []
      }
    }};

    this.apiClient = {};
    spaceContext.cma = this.apiClient;

    this.container = $('<div>').appendTo('body');

    const field = {
      id: 'FID-internal',
      apiName: 'FID',
      type: 'Text'
    };

    const entry = {
      data: {
        sys: {
          type: 'Entry'
        },
        fields: {}
      }
    };

    this.doc = this.$inject('mocks/entityEditor/Document').create(entry.data);

    this.scope = {
      widget: {
        field: field
      },
      entityInfo: {
        contentType: {
          fields: [field]
        }
      },
      locale: {
        code: 'de',
        internal_code: 'de-internal'
      },
      otDoc: this.doc,
      fieldLocale: {
        access: {
          disabled: false
        },
        doc: {
          valueProperty: K.createMockProperty(null)
        },
        errors$: K.createMockProperty(null)
      },
      fieldController: {
        setInvalid: sinon.spy()
      }
    };


    this.setup = () => {
      return new Promise((resolve, reject) => {
        const el = this.$compile('<cf-iframe-widget>', this.scope);
        this.scope = el.scope();
        const iframe = el.find('iframe')[0];
        iframe.removeAttribute('sandbox');
        iframe.addEventListener('load', () => {
          try {
            const w = iframe.contentWindow;
            w.console = window.console;
            w.contentfulExtension.init((api) => {
              api.nextTick = () => {
                this.$apply();
                // By adding a timeout to the iframe window we assure that the
                // promise only resolves when the iframe event loops has at
                // least been run once.
                return new Promise((resolve) => {
                  w.setTimeout(resolve, 1);
                });
              };
              resolve(api);
            });
            this.$apply();
          } catch (e) {
            reject(e);
          }
        });
        el.appendTo(this.container);
      });
    };

    this.setDocValueAt = function (path, value) {
      this.doc.setValueAt(path, value);
      this.doc.changes.emit(path);
    };
  });

  afterEach(function () {
    this.container.remove();
  });

  describe('#field', function () {
    beforeEach(function () {
      this.scope.widget.field.validations = ['VALIDATION'];
    });

    it('receives #validations property', function* (api) {
      expect(api.field.validations).toEqual(['VALIDATION']);
    });

    describe('#getValue()', function () {
      beforeEach(function () {
        this.doc.setValueAt(['fields'], {
          'FID-internal': {'de-internal': 'INITIAL'}
        });
      });

      it('gets initial value', function* (api) {
        expect(api.field.getValue()).toEqual('INITIAL');
      });

      it('gets updated value when document is changed', function* (api) {
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield api.nextTick();
        expect(api.field.getValue()).toEqual('VALUE');
      });
    });

    describe('#onValueChanged()', function () {
      it('calls callback after when document changes', function* (api) {
        const valueChanged = sinon.stub();
        api.field.onValueChanged(valueChanged);
        valueChanged.reset();
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield api.nextTick();
        sinon.assert.calledOnce(valueChanged);
        sinon.assert.calledWithExactly(valueChanged, 'VALUE');
      });

      it('does not call callback after detaching', function* (api) {
        const valueChanged = sinon.stub();
        // We make sure that it is called once in order to prevent
        // errors when the event is not dispatched at all.
        api.field.onValueChanged(valueChanged);

        const detach = api.field.onValueChanged(valueChanged);
        valueChanged.reset();
        detach();
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield api.nextTick();
      });

      it('calls callback with most recently dispatched value', function* (api) {
        const valueChanged = sinon.spy();
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        yield api.nextTick();
        api.field.onValueChanged(valueChanged);
        sinon.assert.calledOnce(valueChanged);
        sinon.assert.calledWithExactly(valueChanged, 'VALUE');
      });
    });

    describe('#onIsDisabledChanged', function () {
      when('initially disabled', function () {
        this.scope.fieldLocale.access.disabled = true;
      })
      .it('receives default value', function* (api) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged);
        sinon.assert.calledWithExactly(isDisabledChanged, true);
      });

      when('initially enabled', function () {
        this.scope.fieldLocale.access.disabled = true;
      })
      .it('receives default value', function* (api) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged);
        sinon.assert.calledWithExactly(isDisabledChanged, true);
      });

      it('calls callback when disable status of field is changed', function* (api) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged);
        yield api.nextTick();
        isDisabledChanged.reset();
        this.scope.fieldLocale.access.disabled = true;
        yield api.nextTick();
        sinon.assert.calledOnce(isDisabledChanged);
        sinon.assert.calledWithExactly(isDisabledChanged, true);
      });
    });

    describe('#onSchemaErrorsChanged()', function () {
      when('there are initial errors', function () {
        this.scope.fieldLocale.errors$.set(['INITIAL']);
      })
      .it('receives the initial errors', function* (api) {
        const cb = sinon.spy();
        api.field.onSchemaErrorsChanged(cb);
        sinon.assert.calledWithExactly(cb, ['INITIAL']);
      });

      it('triggers when errors change', function* (api) {
        const cb = sinon.spy();
        api.field.onSchemaErrorsChanged(cb);
        yield api.nextTick();
        cb.reset();
        this.scope.fieldLocale.errors$.set(['errors']);
        yield api.nextTick();
        sinon.assert.calledOnce(cb);
        sinon.assert.calledWithExactly(cb, ['errors']);
      });
    });

    describe('#setValue()', function () {
      testValueMethods('setValue', 'VAL');
    });

    describe('#removeValue()', function () {
      testValueMethods('removeValue');
    });

    describe('#setInvalid', function () {
      it('proxies call to setInvalid method on scope.fieldController', function* (api) {
        api.field.setInvalid(true, this.scope.locale.code);
        yield api.nextTick();
        sinon.assert.calledWithExactly(
          this.scope.fieldController.setInvalid,
          this.scope.locale.code,
          true
        );
      });
    });

    function testValueMethods (method, value) {
      it(`calls "otDoc.${method}At()" with current field path`, function* (api) {
        if (_.isUndefined(value)) {
          yield api.field[method]();
          sinon.assert.calledWith(this.scope.otDoc[`${method}At`], ['fields', 'FID-internal', 'de-internal']);
        } else {
          yield api.field[method](value);
          sinon.assert.calledWith(this.scope.otDoc[`${method}At`], ['fields', 'FID-internal', 'de-internal'], value);
        }
      });

      it('resolves', function* (api) {
        const success = sinon.stub();
        yield api.field[method](value).then(success);
        sinon.assert.called(success);
      });

      it(`rejects when "otDoc.${method}At()" fails`, function* (api) {
        this.scope.otDoc[`${method}At`] = sinon.stub().rejects();
        const errored = sinon.stub();
        yield api.field[method](value).catch(errored);
        sinon.assert.calledWith(errored);
      });
    }
  });

  describe('#entry', function () {
    const SYS_0 = {type: 'Entry', version: 0};
    const SYS_1 = {type: 'Entry', version: 1};

    beforeEach(function () {
      this.doc.setValueAt(['sys'], SYS_0);
    });

    describe('#getSys()', function () {
      it('returns the initial sys object', function* (api) {
        const sys = api.entry.getSys();
        expect(sys).toEqual(SYS_0);
      });

      it('returns updated value when document property changes', function* (api) {
        expect(api.entry.getSys()).toEqual(SYS_0);
        this.doc.setValueAt(['sys'], SYS_1);
        yield api.nextTick();
        expect(api.entry.getSys()).toEqual(SYS_1);
      });
    });

    describe('#onSysChanged()', function () {
      it('calls listener with initial value', function* (api) {
        const listener = sinon.stub();
        api.entry.onSysChanged(listener);
        sinon.assert.calledWith(listener, SYS_0);
      });

      it('calls listener when document property changes', function* (api) {
        const listener = sinon.stub();
        api.entry.onSysChanged(listener);
        listener.reset();
        this.doc.setValueAt(['sys'], SYS_1);
        yield api.nextTick();
        sinon.assert.calledWith(listener, SYS_1);
      });
    });
  });

  describe('#fields', function () {
    beforeEach(function () {
      this.scope.entityInfo.contentType.fields = [
        this.scope.widget.field,
        {id: 'f2-internal', apiName: 'f2', localized: true},
        {id: 'f3-internal', apiName: 'f3', localized: false}
      ];

      this.doc.setValueAt(['fields'], {
        'f2-internal': {
          'en-internal': 'INITIAL en',
          'de-internal': 'INITIAL de'
        }
      });
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

      it('returns updated value when document changes', function* (api) {
        this.setDocValueAt(['fields', 'f2-internal', 'en'], 'VAL en');
        yield api.nextTick();
        expect(api.entry.fields.f2.getValue()).toEqual('VAL en');

        this.setDocValueAt(['fields', 'f2-internal', 'de'], 'VAL de');
        yield api.nextTick();
        expect(api.entry.fields.f2.getValue('de')).toEqual('VAL de');
      });
    });

    describe('#setValue()', function () {
      it('calls "otDoc.setValueAt()" with current field path', function* (api) {
        const field = api.entry.fields.f2;
        yield field.setValue('VAL');
        sinon.assert.calledWith(this.scope.otDoc.setValueAt, ['fields', 'f2-internal', 'en-internal'], 'VAL');
        yield field.setValue('VAL', 'de');
        sinon.assert.calledWith(this.scope.otDoc.setValueAt, ['fields', 'f2-internal', 'de-internal'], 'VAL');
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

      it('rejects when "otDoc.setValueAt()" fails', function* (api) {
        this.scope.otDoc.setValueAt = sinon.stub().rejects();
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
        {code: 'en', internal_code: 'en-internal', default: true},
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
    // TODO firefox does not yet support for (const x in y)
    /* eslint prefer-const: off */
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

  describe('#dialogs methods', function () {
    const methods = [
      ['selectSingleEntry', 'Entry', false],
      ['selectSingleAsset', 'Asset', false],
      ['selectMultipleEntries', 'Entry', true],
      ['selectMultipleAssets', 'Asset', true]
    ];

    beforeEach(function () {
      this.selector = this.$inject('entitySelector');
      this.openStub = sinon.stub().resolves(null);
      this.selector.openFromExtension = this.openStub;
    });

    it('delegates to entity selector call', function* (api) {
      for (let [method, entityType, multiple] of methods) {
        const result = yield api.dialogs[method]({test: true});
        expect(result).toBe(null);
        sinon.assert.calledWithMatch(this.openStub, {
          test: true, entityType, multiple
        });
      }
    });

    it('resolves with result of single selection', function* (api) {
      this.openStub.resolves({result: true});
      for (let [method] of methods.slice(0, 2)) {
        expect(yield api.dialogs[method]()).toEqual({result: true});
      }
    });

    it('resolves with result of multi selection', function* (api) {
      this.openStub.resolves([{i: 1}, {i: 2}]);
      for (let [method] of methods.slice(2)) {
        expect(yield api.dialogs[method]()).toEqual([{i: 1}, {i: 2}]);
      }
    });

    it('rejects if an error occurred', function* (api) {
      this.openStub.rejects(new Error('boom!'));
      for (let [method] of methods) {
        const err = yield api.dialogs[method]().catch(_.identity);
        expect(err.message).toBe('boom!');
      }
    });
  });

  describe('#user', function () {
    beforeEach(function () {
      const spaceContext = this.$inject('spaceContext');
      spaceContext.space = { data: {
        sys: {},
        spaceMembership: {
          admin: false,
          sys: { id: 'SMID' },
          roles: [{
            sys: 'OMITTED',
            name: 'Assistant to the regional manager',
            description: 'Not “Assistant regional manager”',
            policies: [],
            permissions: {}
          }],
          user: {
            sys: { id: 'b33ts' },
            firstName: 'Dwight',
            lastName: 'Schrute',
            email: 'dwight@dundermifflin.com'
          }
        }
      }};
    });

    it('makes user data available', function* (api) {
      expect(api.user).toEqual({
        sys: { id: 'b33ts' },
        firstName: 'Dwight',
        lastName: 'Schrute',
        email: 'dwight@dundermifflin.com',
        spaceMembership: {
          admin: false,
          sys: { id: 'SMID' },
          roles: [{
            name: 'Assistant to the regional manager',
            description: 'Not “Assistant regional manager”'
          }]
        }
      });
    });
  });

  function when (desc1, setup) {
    return {it: whenIt, fit: whenFit};

    function whenIt (desc2, gen) {
      it(`when ${desc1} it ${desc2}`, gen, setup);
    }

    function whenFit (desc2, gen) {
      window.fit(`when ${desc1} it ${desc2}`, gen, setup);
    }
  }
});
