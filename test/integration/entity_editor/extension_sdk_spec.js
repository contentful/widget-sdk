import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import createLocaleStoreMock from 'test/utils/createLocaleStoreMock';
import _ from 'lodash';
import $ from 'jquery';
import APIClient from 'data/APIClient.es6';
import { $initialize, $inject, $compile, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

// TODO: This integration suite should be removed.
// We want to drop Web App dependency on the SDK.
// All the testing should be done here:
// https://github.com/contentful/ui-extensions-sdk/tree/master/test

describe('Extension SDK', () => {
  beforeEach(async function() {
    this.openStub = sinon.stub().resolves(null);

    this.system.set('services/localeStore.es6', {
      default: createLocaleStoreMock()
    });

    this.system.set('search/EntitySelector/entitySelector.es6', {
      openFromExtension: this.openStub
    });

    await $initialize(this.system);

    const spaceContext = $inject('mocks/spaceContext').init();
    const createDocument = $inject('mocks/entityEditor/Document').create;
    spaceContext.space = {
      data: {
        sys: {},
        spaceMember: {
          sys: {
            user: {
              sys: {}
            }
          },
          roles: []
        },
        spaceMembership: {
          sys: {
            user: {
              sys: {}
            }
          },
          roles: []
        }
      }
    };

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

    this.doc = createDocument(entry.data);

    this.scope = {
      widget: {
        field,
        widgetNamespace: 'extension',
        descriptor: {
          srcdoc:
            '<!doctype html>' +
            '<script src="/base/node_modules/contentful-ui-extensions-sdk/dist/cf-extension-api.js"></script>'
        },
        parameters: {
          instance: {},
          installation: {}
        }
      },
      editorData: {
        editorInterface: {
          controls: [],
          sidebar: []
        }
      },
      preferences: {
        showDisabledFields: false
      },
      localeData: {},
      entityInfo: {
        contentType: {
          sys: { id: 'ct' },
          fields: [field]
        }
      },
      locale: {
        code: 'de',
        internal_code: 'de-internal'
      },
      otDoc: this.doc,
      fieldLocale: {
        access$: K.createMockProperty({ disabled: false }),
        errors$: K.createMockProperty(null)
      },
      fieldController: {
        setInvalid: sinon.spy()
      }
    };

    this.setup = () => {
      return new Promise((resolve, reject) => {
        const el = $compile('<cf-widget-renderer />', this.scope);
        this.scope = el.scope();
        const iframe = el.find('iframe')[0];
        iframe.removeAttribute('sandbox');
        iframe.addEventListener('load', () => {
          try {
            const w = iframe.contentWindow;
            w.console = window.console;
            w.contentfulExtension.init(api => {
              api.nextTick = () => {
                $apply();
                // By adding a timeout to the iframe window we assure that the
                // promise only resolves when the iframe event loops has at
                // least been run once.
                return new Promise(resolve => {
                  w.setTimeout(resolve, 1);
                });
              };
              resolve(api);
            });
            $apply();
          } catch (e) {
            reject(e);
          }
        });
        el.appendTo(this.container);
      });
    };

    this.setDocValueAt = function(path, value) {
      this.doc.setValueAt(path, value);
      this.doc.changes.emit(path);
    };
  });

  afterEach(function() {
    this.container.remove();
  });

  describe('#field', () => {
    beforeEach(function() {
      this.scope.widget.field.validations = ['VALIDATION'];
    });

    it('receives #validations property', async function(api) {
      expect(api.field.validations).toEqual(['VALIDATION']);
    });

    describe('#getValue()', () => {
      beforeEach(function() {
        this.doc.setValueAt(['fields'], {
          'FID-internal': { 'de-internal': 'INITIAL' }
        });
      });

      it('gets initial value', async function(api) {
        expect(api.field.getValue()).toEqual('INITIAL');
      });

      it('gets updated value when document is changed', async function(api) {
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        await api.nextTick();
        expect(api.field.getValue()).toEqual('VALUE');
      });
    });

    describe('#onValueChanged()', () => {
      it('calls callback after when document changes', async function(api) {
        const valueChanged = sinon.stub();
        api.field.onValueChanged(valueChanged);
        valueChanged.reset();
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        await api.nextTick();
        sinon.assert.calledOnce(valueChanged);
        sinon.assert.calledWithExactly(valueChanged, 'VALUE');
      });

      it('does not call callback after detaching', async function(api) {
        const valueChanged = sinon.stub();
        // We make sure that it is called once in order to prevent
        // errors when the event is not dispatched at all.
        api.field.onValueChanged(valueChanged);

        const detach = api.field.onValueChanged(valueChanged);
        valueChanged.reset();
        detach();
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        await api.nextTick();
      });

      it('calls callback with most recently dispatched value', async function(api) {
        const valueChanged = sinon.spy();
        this.setDocValueAt(['fields', 'FID-internal', 'de-internal'], 'VALUE');
        await api.nextTick();
        api.field.onValueChanged(valueChanged);
        sinon.assert.calledOnce(valueChanged);
        sinon.assert.calledWithExactly(valueChanged, 'VALUE');
      });
    });

    describe('#onIsDisabledChanged', () => {
      when('initially disabled', function() {
        this.scope.fieldLocale.access$.set({ disabled: true });
      }).it('receives default value', async function(api) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged);
        sinon.assert.calledWithExactly(isDisabledChanged, true);
      });

      when('initially enabled', function() {
        this.scope.fieldLocale.access$.set({ disabled: true });
      }).it('receives default value', async function(api) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged);
        sinon.assert.calledWithExactly(isDisabledChanged, true);
      });

      it('calls callback when disable status of field is changed', async function(api) {
        const isDisabledChanged = sinon.spy();
        api.field.onIsDisabledChanged(isDisabledChanged);
        await api.nextTick();
        isDisabledChanged.reset();
        this.scope.fieldLocale.access$.set({ disabled: true });
        await api.nextTick();
        sinon.assert.calledOnce(isDisabledChanged);
        sinon.assert.calledWithExactly(isDisabledChanged, true);
      });
    });

    describe('#onSchemaErrorsChanged()', () => {
      when('there are initial errors', function() {
        this.scope.fieldLocale.errors$.set(['INITIAL']);
      }).it('receives the initial errors', async function(api) {
        const cb = sinon.spy();
        api.field.onSchemaErrorsChanged(cb);
        sinon.assert.calledWithExactly(cb, ['INITIAL']);
      });

      it('triggers when errors change', async function(api) {
        const cb = sinon.spy();
        api.field.onSchemaErrorsChanged(cb);
        await api.nextTick();
        cb.reset();
        this.scope.fieldLocale.errors$.set(['errors']);
        await api.nextTick();
        sinon.assert.calledOnce(cb);
        sinon.assert.calledWithExactly(cb, ['errors']);
      });
    });

    describe('#setValue()', () => {
      testValueMethods('setValue', 'VAL');
    });

    describe('#removeValue()', () => {
      testValueMethods('removeValue');
    });

    describe('#setInvalid', () => {
      it('proxies call to setInvalid method on scope.fieldController', async function(api) {
        api.field.setInvalid(true, this.scope.locale.code);
        await api.nextTick();
        sinon.assert.calledWithExactly(
          this.scope.fieldController.setInvalid,
          this.scope.locale.code,
          true
        );
      });
    });

    function testValueMethods(method, value) {
      it(`calls "otDoc.${method}At()" with current field path`, async function(api) {
        if (_.isUndefined(value)) {
          await api.field[method]();
          sinon.assert.calledWith(this.scope.otDoc[`${method}At`], [
            'fields',
            'FID-internal',
            'de-internal'
          ]);
        } else {
          await api.field[method](value);
          sinon.assert.calledWith(
            this.scope.otDoc[`${method}At`],
            ['fields', 'FID-internal', 'de-internal'],
            value
          );
        }
      });

      it('resolves', async function(api) {
        const success = sinon.stub();
        await api.field[method](value).then(success);
        sinon.assert.called(success);
      });

      it(`rejects when "otDoc.${method}At()" fails`, async function(api) {
        this.scope.otDoc[`${method}At`] = sinon.stub().rejects();
        const errored = sinon.stub();
        await api.field[method](value).catch(errored);
        sinon.assert.calledWith(errored);
      });
    }
  });

  describe('#entry', () => {
    const SYS_0 = { type: 'Entry', version: 0 };
    const SYS_1 = { type: 'Entry', version: 1 };

    beforeEach(function() {
      this.doc.setValueAt(['sys'], SYS_0);
    });

    describe('#getSys()', () => {
      it('returns the initial sys object', async function(api) {
        const sys = api.entry.getSys();
        expect(sys).toEqual(SYS_0);
      });

      it('returns updated value when document property changes', async function(api) {
        expect(api.entry.getSys()).toEqual(SYS_0);
        this.doc.setValueAt(['sys'], SYS_1);
        await api.nextTick();
        expect(api.entry.getSys()).toEqual(SYS_1);
      });
    });

    describe('#onSysChanged()', () => {
      it('calls listener with initial value', async function(api) {
        const listener = sinon.stub();
        api.entry.onSysChanged(listener);
        sinon.assert.calledWith(listener, SYS_0);
      });

      it('calls listener when document property changes', async function(api) {
        const listener = sinon.stub();
        api.entry.onSysChanged(listener);
        listener.reset();
        this.doc.setValueAt(['sys'], SYS_1);
        await api.nextTick();
        sinon.assert.calledWith(listener, SYS_1);
      });
    });
  });

  describe('#fields', () => {
    beforeEach(function() {
      this.scope.entityInfo.contentType.fields = [
        this.scope.widget.field,
        { id: 'f2-internal', apiName: 'f2', localized: true },
        { id: 'f3-internal', apiName: 'f3', localized: false }
      ];

      this.doc.setValueAt(['fields'], {
        'f2-internal': {
          'en-internal': 'INITIAL en',
          'de-internal': 'INITIAL de'
        }
      });
    });

    it('has #id property', async function(api) {
      expect(api.entry.fields.f2.id).toEqual('f2');
    });

    it('has #locales property for localized field', async function(api) {
      expect(api.entry.fields.f2.locales).toEqual(['en', 'de']);
    });

    it('has #locales property for non-localized field', async function(api) {
      expect(api.entry.fields.f3.locales).toEqual(['en']);
    });

    describe('#getValue()', () => {
      it('returns initial value', async function(api) {
        expect(api.entry.fields.f2.getValue()).toEqual('INITIAL en');
        expect(api.entry.fields.f2.getValue('de')).toEqual('INITIAL de');
      });

      it('returns updated value when document changes', async function(api) {
        this.setDocValueAt(['fields', 'f2-internal', 'en'], 'VAL en');
        await api.nextTick();
        expect(api.entry.fields.f2.getValue()).toEqual('VAL en');

        this.setDocValueAt(['fields', 'f2-internal', 'de'], 'VAL de');
        await api.nextTick();
        expect(api.entry.fields.f2.getValue('de')).toEqual('VAL de');
      });

      it('returns updated value when entire doc is replaced', async function(api) {
        this.setDocValueAt([], {
          sys: { id: 'f2-internal', type: 'Entry' },
          fields: { 'f2-internal': { 'en-internal': 'VAL' } }
        });
        await api.nextTick();
        expect(api.entry.fields.f2.getValue()).toEqual('VAL');
      });
    });

    describe('#setValue()', () => {
      it('calls "otDoc.setValueAt()" with current field path', async function(api) {
        const field = api.entry.fields.f2;
        await field.setValue('VAL');
        sinon.assert.calledWith(
          this.scope.otDoc.setValueAt,
          ['fields', 'f2-internal', 'en-internal'],
          'VAL'
        );
        await field.setValue('VAL', 'de');
        sinon.assert.calledWith(
          this.scope.otDoc.setValueAt,
          ['fields', 'f2-internal', 'de-internal'],
          'VAL'
        );
      });

      it('throws if locale is unknown', async function(api) {
        expect(() => {
          api.entry.fields.f2.setValue('VAL', 'unknown');
        }).toThrow();

        expect(() => {
          api.entry.fields.f3.setValue('VAL', 'de');
        }).toThrow();
      });

      it('resolves', async function(api) {
        const success = sinon.stub();
        await api.entry.fields.f2.setValue('VAL').then(success);
        sinon.assert.calledWith(success);
      });

      it('rejects when "otDoc.setValueAt()" fails', async function(api) {
        this.scope.otDoc.setValueAt = sinon.stub().rejects();
        const errored = sinon.stub();
        await api.entry.fields.f2.setValue('VAL').catch(errored);
        sinon.assert.calledWith(errored);
      });
    });
  });

  describe('#locales', () => {
    it('provides the default locale code', async function(api) {
      expect(api.locales.default).toEqual('en');
    });

    it('provides all available locales codes', async function(api) {
      expect(api.locales.available).toEqual(['en', 'de']);
    });
  });

  // TODO: this does not test `getUsers` and all upload methods.
  describe('#space methods', () => {
    beforeEach(function() {
      const spaceContext = $inject('spaceContext');
      spaceContext.publishedCTs = {
        get: sinon.stub()
      };
      this.args = {
        sys: {
          contentType: {
            sys: { id: 'foo' }
          }
        }
      };
      this.methods = [
        'getContentType',
        'getEntry',
        'getEntrySnapshots',
        'getAsset',
        'getEditorInterface',
        'getPublishedEntries',
        'getPublishedAssets',
        'getContentTypes',
        'getEntries',
        'getAssets',
        'createContentType',
        'createEntry',
        'createAsset',
        'updateContentType',
        'updateEntry',
        'updateAsset',
        'deleteContentType',
        'deleteEntry',
        'deleteAsset',
        'publishEntry',
        'publishAsset',
        'unpublishEntry',
        'unpublishAsset',
        'archiveEntry',
        'archiveAsset',
        'unarchiveEntry',
        'unarchiveAsset'
      ];
    });

    it('delegates to API client and responds with data', async function(api) {
      const { args } = this;
      for (const method of this.methods) {
        const data = { sys: { type: 'bar' } };
        this.apiClient[method] = sinon
          .stub()
          .withArgs(args)
          .resolves(data);
        const response = await api.space[method](args);
        sinon.assert.calledOnce(this.apiClient[method]);
        sinon.assert.calledWithExactly(this.apiClient[method], args);
        expect(response).toEqual(data);
      }
    });

    it('delegates to API and throws error', async function(api) {
      const { args } = this;

      for (const method of this.methods) {
        this.apiClient[method] = sinon
          .stub()
          .withArgs(args)
          .rejects({
            code: 'CODE',
            body: 'BODY'
          });
        const error = await api.space[method](args).catch(e => e);
        sinon.assert.calledOnce(this.apiClient[method]);
        sinon.assert.calledWithExactly(this.apiClient[method], args);
        expect(error).toEqual({
          code: 'CODE',
          data: 'BODY',
          message: 'Request failed.'
        });
      }
    });

    it('has a ApiClient method for each space method', function() {
      const cma = new APIClient({});
      for (const method of this.methods) {
        expect(typeof cma[method]).toBe('function');
      }
    });
  });

  describe('#dialogs methods', () => {
    const methods = [
      ['selectSingleEntry', 'Entry', false],
      ['selectSingleAsset', 'Asset', false],
      ['selectMultipleEntries', 'Entry', true],
      ['selectMultipleAssets', 'Asset', true]
    ];

    it('delegates to entity selector call', async function(api) {
      for (const [method, entityType, multiple] of methods) {
        const result = await api.dialogs[method]({ test: true });
        expect(result).toBe(null);
        sinon.assert.calledWithMatch(this.openStub, {
          test: true,
          entityType,
          multiple
        });
      }
    });

    it('resolves with result of single selection', async function(api) {
      this.openStub.resolves({ result: true });
      for (const [method] of methods.slice(0, 2)) {
        expect(await api.dialogs[method]()).toEqual({ result: true });
      }
    });

    it('resolves with result of multi selection', async function(api) {
      this.openStub.resolves([{ i: 1 }, { i: 2 }]);
      for (const [method] of methods.slice(2)) {
        expect(await api.dialogs[method]()).toEqual([{ i: 1 }, { i: 2 }]);
      }
    });

    it('rejects if an error occurred', async function(api) {
      this.openStub.rejects(new Error('boom!'));
      for (const [method] of methods) {
        const err = await api.dialogs[method]().catch(_.identity);
        expect(err.message).toBe('boom!');
      }
    });
  });

  describe('#user', () => {
    beforeEach(function() {
      const spaceContext = $inject('spaceContext');
      spaceContext.space = {
        data: {
          sys: {},
          spaceMembership: {
            admin: false,
            sys: {
              id: 'SMID',
              user: {
                sys: { id: 'b33ts' },
                firstName: 'Dwight',
                lastName: 'Schrute',
                email: 'dwight@dundermifflin.com',
                avatarUrl: 'https://avatar.com/x.jpg'
              }
            },
            roles: [
              {
                sys: 'OMITTED',
                name: 'Assistant to the regional manager',
                description: 'Not “Assistant regional manager”',
                policies: [],
                permissions: {}
              }
            ]
          },
          spaceMember: {
            admin: false,
            sys: {
              id: 'SMID',
              user: {
                sys: { id: 'b33ts' },
                firstName: 'Dwight',
                lastName: 'Schrute',
                email: 'dwight@dundermifflin.com',
                avatarUrl: 'https://avatar.com/x.jpg'
              }
            },
            roles: [
              {
                sys: 'OMITTED',
                name: 'Assistant to the regional manager',
                description: 'Not “Assistant regional manager”',
                policies: [],
                permissions: {}
              }
            ]
          }
        }
      };
    });

    it('makes user data available', async function(api) {
      expect(api.user).toEqual({
        sys: { id: 'b33ts', type: 'User' },
        firstName: 'Dwight',
        lastName: 'Schrute',
        email: 'dwight@dundermifflin.com',
        avatarUrl: 'https://avatar.com/x.jpg',
        spaceMembership: {
          admin: false,
          sys: { id: 'SMID', type: 'SpaceMembership' },
          roles: [
            {
              name: 'Assistant to the regional manager',
              description: 'Not “Assistant regional manager”'
            }
          ]
        }
      });
    });
  });

  describe('#parameters', () => {
    it('both installation and instance parmeters default to empty object', async function(api) {
      expect(api.parameters).toEqual({
        installation: {},
        instance: {}
      });
    });

    when('parameter values are provided', function() {
      this.scope.widget.parameters.instance = { test: true, x: 'y' };
      this.scope.widget.parameters.installation = { flag: true, num: 123 };
    }).it('exposes them in the API', async function(api) {
      expect(api.parameters).toEqual({
        installation: { flag: true, num: 123 },
        instance: { test: true, x: 'y' }
      });
    });
  });

  function when(desc1, setup) {
    return { it: whenIt, fit: whenFit };

    function whenIt(desc2, gen) {
      it(`when ${desc1} it ${desc2}`, gen, setup);
    }

    function whenFit(desc2, gen) {
      window.fit(`when ${desc1} it ${desc2}`, gen, setup);
    }
  }
});