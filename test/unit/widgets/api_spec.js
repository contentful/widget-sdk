'use strict';

describe('widgets/API', function () {
  var API;
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
    });
    API = this.$inject('widgets/API');

    var TheLocaleStore = this.$inject('TheLocaleStore');
    this.setLocales = TheLocaleStore.setLocales;

    // API constructor parameters
    this.space = {data: {sys: {id: 'SPACE_ID'}}};
    this.fields = [];
    this.entryData = {fields: {}};
    this.contentTypeData = {};
    this.context = {
      field: {},
      locale: {code: 'en_US'},
      isDisabled: false
    };
    this.postMessage = sinon.stub();
    this.iframe = {
      contentWindow: {postMessage: this.postMessage}
    };

    this.createAPI = function () {
      return new API(
        this.space, this.fields, this.entryData, this.contentTypeData,
        this.context, this.iframe
      );
    };
  });

  describe('#connect()', function () {
    it('sends connect message through channel', function () {
      var api = this.createAPI();
      api.connect();
      sinon.assert.calledOnce(this.postMessage);
      expect(this.postMessage.args[0][0].method).toEqual('connect');
    });

    it('sends entry param', function () {
      this.entryData = 'ENTRY';
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].entry).toEqual('ENTRY');
    });

    it('sends content type param', function () {
      this.contentTypeData = 'CONTENTTYPE';
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].contentType).toEqual('CONTENTTYPE');
    });

    it('sends field param', function () {
      this.entryData.fields = {
        'FID-internal': {'LOCALE-internal': 'VALUE'}
      };
      this.context.field.apiName = 'FID-public';
      this.context.field.id = 'FID-internal';
      this.context.field.type = 'FIELD-TYPE';
      this.context.locale = {
        code: 'LOCALE',
        internal_code: 'LOCALE-internal'
      };
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].field).toEqual({
        id: 'FID-public', locale: 'LOCALE', value: 'VALUE', isDisabled: false, type: 'FIELD-TYPE'
      });
    });

    it('sends fieldInfo param', function () {
      this.setLocales([
        {code: 'en', internal_code: 'en-internal'}
      ]);

      this.fields = [
        {id: 'X-internal', apiName: 'X-public', localized: false}
      ];

      this.entryData.fields = {
        'X-internal': {'en-internal': 'VAL'}
      };

      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].fieldInfo).toEqual([{
        id: 'X-public', values: {'en': 'VAL'}, localized: false, locales: ['en']
      }]);
    });

    it('sends locales param', function () {
      this.setLocales([{code: 'A'}, {code: 'B'}]);
      this.createAPI().connect();
      expect(this.postMessage.args[0][0].params[0].locales.default).toEqual('A');
      expect(this.postMessage.args[0][0].params[0].locales.available).toEqual(['A', 'B']);
    });
  });

  describe('#sendFieldValueChange()', function () {
    beforeEach(function () {
      this.setLocales([
        {code: 'LC-public', internal_code: 'LC-internal'}
      ]);
      this.fields = [
        {id: 'FID-internal', apiName: 'FID-public'}
      ];
      this.api = this.createAPI();
      this.api.connect();
      this.postMessage.reset();
    });

    it('sends "valueChanged" message', function () {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].method).toEqual('valueChanged');
    });

    it('translates the internal field id', function () {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].params[0]).toEqual('FID-public');
    });

    it('translates the internal locale id', function () {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].params[1]).toEqual('LC-public');
    });

    it('sends the value parameter', function () {
      this.api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(this.postMessage.args[0][0].params[2]).toEqual('VALUE');
    });
  });

  describe('#buildDocPath()', function () {
    it('tranlates public to internal ids', function () {
      this.setLocales([{code: 'LC-public', internal_code: 'LC-internal'}]);
      this.fields = [{
        id: 'FID-internal', apiName: 'FID-public'
      }];
      var api = this.createAPI();

      var path = api.buildDocPath('FID-public', 'LC-public');
      expect(path).toEqual(['fields', 'FID-internal', 'LC-internal']);
    });
  });

});
