'use strict';

import _ from 'lodash';

describe('widgets/API', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });

    const API = this.$inject('widgets/API');

    const TheLocaleStore = this.$inject('TheLocaleStore');
    this.setLocales = TheLocaleStore.setLocales;

    // API constructor parameters
    const spaceMembership = {
      sys: {},
      user: {
        sys: {},
        firstName: 'Jakub'
      },
      roles: []
    };

    this.fields = [];
    this.entryData = { fields: {} };
    this.contentTypeData = {};
    this.context = {
      field: {},
      locale: { code: 'en_US' },
      isDisabled: false
    };
    this.postMessage = sinon.stub();
    this.iframe = {
      contentWindow: { postMessage: this.postMessage }
    };

    const parameters = {
      instance: { test: true },
      installation: { hello: 'world' }
    };

    this.createAPI = function() {
      return new API(
        {},
        spaceMembership,
        parameters,
        this.fields,
        this.entryData,
        this.contentTypeData,
        this.context,
        this.iframe
      );
    };
  });

  describe('#connect()', () => {
    it('sends connect message through channel', function() {
      const api = this.createAPI();
      api.connect();
      sinon.assert.calledOnce(this.postMessage);
      expect(this.postMessage.args[0][0].method).toEqual('connect');
    });

    it('sends entry param', function() {
      this.entryData = 'ENTRY';
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].entry).toEqual('ENTRY');
    });

    it('sends content type param', function() {
      this.contentTypeData = 'CONTENTTYPE';
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].contentType).toEqual('CONTENTTYPE');
    });

    it('sends field param', function() {
      this.entryData.fields = {
        'FID-internal': { 'LOCALE-internal': 'VALUE' }
      };
      this.context.field.apiName = 'FID-public';
      this.context.field.id = 'FID-internal';
      this.context.field.type = 'FIELD-TYPE';
      this.context.field.validations = 'VALIDATIONS';
      this.context.locale = {
        code: 'LOCALE',
        internal_code: 'LOCALE-internal'
      };
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].field).toEqual({
        id: 'FID-public',
        locale: 'LOCALE',
        value: 'VALUE',
        isDisabled: false,
        type: 'FIELD-TYPE',
        validations: 'VALIDATIONS'
      });
    });

    it('sends fieldInfo param', function() {
      this.setLocales([{ code: 'en', internal_code: 'en-internal', default: true }]);

      this.fields = [{ id: 'X-internal', apiName: 'X-public', localized: false }];

      this.entryData.fields = {
        'X-internal': { 'en-internal': 'VAL' }
      };

      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].fieldInfo).toEqual([
        {
          id: 'X-public',
          values: { en: 'VAL' },
          localized: false,
          locales: ['en']
        }
      ]);
    });

    it('sends locales param', function() {
      this.setLocales([{ code: 'A', default: true }, { code: 'B' }]);
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].locales.default).toEqual('A');
      expect(this.postMessage.args[0][0].params[0].locales.available).toEqual(['A', 'B']);
    });

    it('sends user info', function() {
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].user.firstName).toEqual('Jakub');
    });

    it('sends parameters', function() {
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].parameters).toEqual({
        instance: { test: true },
        installation: { hello: 'world' }
      });
    });
  });

  describe('#sendFieldValueChange()', () => {
    beforeEach(function() {
      this.setLocales([{ code: 'LC-public', internal_code: 'LC-internal', default: true }]);
      this.fields = [{ id: 'FID-internal', apiName: 'FID-public' }];
      this.api = this.createAPI();
      this.api.connect();
      this.postMessage.reset();
    });

    it('sends "valueChanged" message', function() {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].method).toEqual('valueChanged');
    });

    it('translates the internal field id', function() {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].params[0]).toEqual('FID-public');
    });

    it('translates the internal locale id', function() {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].params[1]).toEqual('LC-public');
    });

    it('sends the value parameter', function() {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].params[2]).toEqual('VALUE');
    });
  });

  describe('#buildDocPath()', () => {
    it('tranlates public to internal ids', function() {
      this.setLocales([{ code: 'LC-public', internal_code: 'LC-internal' }]);
      this.fields = [
        {
          id: 'FID-internal',
          apiName: 'FID-public'
        }
      ];
      const api = this.createAPI();

      const path = api.buildDocPath('FID-public', 'LC-public');
      expect(path).toEqual(['fields', 'FID-internal', 'LC-internal']);
    });
  });

  describe('default handlers', () => {
    describe('#openDialog', () => {
      beforeEach(function() {
        const api = this.createAPI();
        this.handler = api.channel.handlers.openDialog;
      });

      it('rejects if dialog type is unknown', function() {
        return this.handler('xxx', {}).catch(err => {
          expect(err instanceof Error).toBe(true);
          expect(err.message).toBe('Unknown dialog type.');
        });
      });

      it('calls entity selector', function() {
        const spy = sinon.spy();
        const opts = { test: true };
        this.$inject('entitySelector').openFromExtension = spy;

        this.handler('entitySelector', opts);
        sinon.assert.calledOnce(spy.withArgs(opts));
      });
    });
  });
});
