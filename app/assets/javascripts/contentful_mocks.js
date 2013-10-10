'use strict';

var mocks = angular.module('contentful/mocks', []);

mocks.factory('cfStub', function (contentfulClient, SpaceContext) {
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

  cfStub.locales = function () {
    return _.map(arguments, function (code, index) {
      return cfStub.locale(code, {'default': index === 0});
    });
  };

  cfStub.space = function (id, extension) {
    id = id || 'testSpace';
    var client = new Client(adapter);
    var testSpace;
    client.getSpace(id, function (err, space) {
      testSpace = space;
    });
    adapter.respondWith(null, _.merge({
      sys: {
        id: id
      },
      locales: cfStub.locales('en-US', 'de-DE')
    }, extension));
    return testSpace;
  };

  cfStub.contentTypeData = function (id, fields, extensions) {
    fields = fields || [];
    return _.merge({
      fields: fields,
      sys: {
        id: id,
        type: 'ContentType'
      }
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

  cfStub.entry = function (space, id, contentTypeId, fields, extensions) {
    fields = fields || {};
    var entry;
    space.getEntry(id, function (err, res) {
      entry = res;
    });
    adapter.respondWith(null, _.merge({
      fields: fields,
      sys: {
        id: id,
        type: 'Entry',
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: contentTypeId
          }
        }
      }
    }, extensions));
    return entry;
  };

  cfStub.spaceContext = function (space, contentTypes) {
    var spaceContext = new SpaceContext(space);
    spaceContext.refreshContentTypes();
    adapter.respondWith(null, {
      sys: {
        type: 'Array'
      },
      items: contentTypes,
      total: contentTypes.length
    });
    adapter.respondWith(null, {
      sys: {
        type: 'Array'
      },
      items: contentTypes,
      total: contentTypes.length
    });
    return spaceContext;
  };

  return cfStub;
});

mocks.factory('PromisedLoader', function () {
  function SpecPromisedLoader() {}
  SpecPromisedLoader.prototype.load =
  SpecPromisedLoader.loadSpy =
    sinon.stub().returns({
      then: sinon.stub()
    });
  return SpecPromisedLoader;
});

window.createMockEntity = function (id, contentType, entityType) {
  return {
    getId: function () {
      return id;
    },
    // mock for api keys
    getName: function () {
      return id;
    },
    getType: function () {
      return entityType;
    },
    getPublishedVersion: function () {
      return this.data.sys.publishedVersion;
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
      }
    },
    'delete': function (fn) {
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
    },
    connection: {
      state: 'ok'
    }
  };

  function FakeShareJSDoc(entity) {
    this.entity = entity;
    this.snapshot = angular.copy(entity.data);
    if (this.snapshot && this.snapshot.sys) delete this.snapshot.sys.version;
    if (this.snapshot && this.snapshot.sys) delete this.snapshot.sys.updatedAt;
  }

  FakeShareJSDoc.prototype = {
    removeListener: angular.noop,
    //addListener: angular.noop,
    on: angular.noop
  };

  this.token = function () { };
  this.url = function () { };

  this.$get = function () {
    return new FakeShareJSClient();
  };
});

