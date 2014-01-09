'use strict';


var mocks = angular.module('contentful/mocks', []);


mocks.factory('cfStub', function (contentfulClient, SpaceContext) {
  var Client = contentfulClient;
  var Adapter = contentfulClient.adapters.testing;
  var adapter = new Adapter();

  var cfStub = {};
  cfStub.adapter = adapter;

  cfStub.locale = function (code, extraData) {
    return _.extend({
      code: code,
      contentDeliveryApi: true,
      contentManagementApi: true,
      'default': true,
      name: code,
      publish: true
    }, extraData || {});
  };

  cfStub.field = function (id, extraData) {
    return _.extend({
      id: id,
      name: id,
      type: 'Text',
      localized: true
    }, extraData);
  };

  cfStub.locales = function () {
    return _.map(arguments, function (code, index) {
      return cfStub.locale(code, {'default': index === 0});
    });
  };

  cfStub.space = function (id, extraData) {
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
    }, extraData || {}));
    return testSpace;
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

  cfStub.contentTypeData = function (id, fields, extraData) {
    fields = fields || [];
    return _.merge({
      fields: fields,
      sys: {
        id: id,
        type: 'ContentType'
      }
    }, extraData || {});
  };

  cfStub.contentType = function (space, id, name, fields, extraData) {
    var contentType;
    space.getContentType(id, function (err, res) {
      contentType = res;
    });
    var data = cfStub.contentTypeData(id, fields, {
      name: name,
      sys: {
        version: 1
      }
    });
    adapter.respondWith(null, _.merge(data, extraData || {}));
    return contentType;
  };

  cfStub.field = function (id, extraData) {
    return _.extend({
      'id': id,
      'name': id,
      'required': false,
      'localized': true,
      'type': 'Text'
    }, extraData || {});
  };

  cfStub.entry = function (space, id, contentTypeId, fields, extraData) {
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
        version: 1,
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: contentTypeId || 'entryId'
          }
        }
      }
    }, extraData || {}));
    return entry;
  };

  cfStub.asset = function (space, id, fields, extraData) {
    var asset;
    space.getAsset(id, function (err, res) {
      asset = res;
    });
    adapter.respondWith(null, _.merge({
      sys: {
        id: id,
        type: 'Asset',
        version: 1,
      },
      fields: _.merge({
        title: '',
        description: '',
        file: {}
      }, fields || {})
    }, extraData || {}));
    return asset;
  };

  cfStub.apiKey = function (space, id, name, extraData) {
    var apiKey;
    space.getApiKey(id, function (err, res) {
      apiKey = res;
    });
    adapter.respondWith(null, _.merge({
      name: name,
      sys: {
        id: id,
        version: 1,
        type: 'ApiKey',
      }
    }, extraData || {}));
    return apiKey;
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

mocks.provider('ReloadNotification', function () {
  this.$get = function () {
    return {
      trigger: sinon.stub()
    };
  };
});

mocks.provider('cfCanStubs', function ($provide) {
  this.setup = function (reasonsStub) {
    $provide.value('reasonsDenied', reasonsStub);
    $provide.value('authorization', {
      spaceContext: {
        space: {
          sys: { createdBy: { sys: {id: 123} } }
        }
      }
    });
    var userStub = sinon.stub();
    userStub.returns({ sys: {id: 123} });
    $provide.value('authentication', {
      getUser: userStub
    });
  };

  this.$get = function () {};
});
