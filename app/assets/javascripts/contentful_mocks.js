'use strict';

var mocks = angular.module('contentful/mocks', []);

mocks.factory('cfStub', function (contentfulClient) {
  var Client = contentfulClient;
  var Adapter = contentfulClient.adapters.testing;
  var adapter = new Adapter();

  var cfStub = {};
  cfStub.locale = function (code, extensions) {
    return _.extend({
      code: code,
      contentDeliveryApi: true,
      contentManagementApi: true,
      'default': true,
      name: code,
      publish: true
    }, extensions);
  };

  cfStub.space = function (id) {
    id = id || 'testSpace';
    var client = new Client(adapter);
    var testSpace;
    client.getSpace(id, function (err, space) {
      testSpace = space;
    });
    adapter.respondWith(null, {
      locales: [
        cfStub.locale('en-US'),
        cfStub.locale('de-DE', {'default': false}),
        cfStub.locale('pt-PT', {'default': false}),
        cfStub.locale('pt-BR', {'default': false})
      ]
    });
    return testSpace;
  };

  cfStub.contentTypeData = function (id, extensions) {
    return _.merge({
      fields: []
    }, extensions);
  };

  cfStub.field = function (id, extension) {
    return _.extend({
      'id': id,
      'name': id,
      'required': false,
      'localized': true,
      'type': 'Text'
    }, extension);
  };

  return cfStub;
});

window.createMockEntity = function (id, contentType) {
  return {
    getId: function () {
      return id;
    },
    // mock for api keys
    getName: function () {
      return id;
    },
    data: {
      sys: {
        id: id
      },
      displayField: 'title',
      fields: {
        title: {
          'en-US': 'the title'
        },
        file: {
          'en-US': {
            contentType: 'application/octet-stream',
            fileName: 'file.psd'
          }
        }
      },
    },
    delete: function (fn) {
      fn(null, this);
    },
    getContentTypeId: function () {
      return contentType;
    }
  };
};

window.createMockSpace = function (id) {
  var entity = window.createMockEntity(id);
  entity.getPublishLocales = function(){
    return [
      {name: 'en-US', code: 'en-US'},
      {name: 'en-GB', code: 'en-GB'},
      {name: 'pt-PT', code: 'pt-PT'},
      {name: 'pt-BR', code: 'pt-BR'}
    ];
  };
  entity.getDefaultLocale  = function(){
    return {name: 'en-US', code: 'en-US'};
  };

  return entity;
};

mocks.provider('ShareJS', function () {
  function FakeShareJSClient() {
  }

  FakeShareJSClient.prototype = {
    open: function (entity, callback) {
      _.defer(callback, null, new FakeShareJSDoc(entity));
    }
  };

  function FakeShareJSDoc(entity) {
    this.entity = entity;
    this.snapshot = entity.data;
  }

  FakeShareJSDoc.prototype = {
    removeListener: angular.noop,
    addListener: angular.noop
  };

  this.token = function () { };
  this.url = function () { };

  this.$get = function () {
    return new FakeShareJSClient();
  };
});

