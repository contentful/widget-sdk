'use strict';


var mocks = angular.module('contentful/mocks', []);


mocks.factory('cfStub', function (contentfulClient, SpaceContext) {
  var Client = contentfulClient.Client;
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
        id: id,
        createdBy: { sys: {id: 123} }
      },
      locales: cfStub.locales('en-US', 'de-DE'),
      organization: {
        sys: {
          id: '456'
        },
        usage: {},
        subscriptionPlan: {limits: {}}
      }
    }, extraData || {}));
    return testSpace;
  };

  cfStub.spaceContext = function (space, contentTypes) {
    var spaceContext = new SpaceContext(space);
    sinon.stub(spaceContext._contentTypeLoader, '_loadCallback', spaceContext._contentTypeLoader._loadCallbackImmediately);
    sinon.stub(spaceContext._publishedContentTypeLoader, '_loadCallback', spaceContext._publishedContentTypeLoader._loadCallbackImmediately);
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
    spaceContext._contentTypeLoader._loadCallback.restore();
    spaceContext._publishedContentTypeLoader._loadCallback.restore();
    return spaceContext;
  };

  cfStub.mockSpaceContext = function () {
    var space = cfStub.space('test');
    var contentTypeData = cfStub.contentTypeData('testType');
    return cfStub.spaceContext(space, [contentTypeData]);
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

mocks.config(function ($provide) {
  $provide.decorator('ShareJS', function ($delegate) {
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

    $delegate.open = function (entity, callback) {
      _.defer(callback, null, new FakeShareJSDoc(entity));
    };

    $delegate.isConnected = function () {
      return true;
    };

    return $delegate;
  });
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

mocks.constant('delayedInvocationStub', (function () {
  function delayedInvocationStub (originalFunction) {
    var result;
    function delayedFunction() {
      /*jshint validthis:true */
      delayedFunction.calls.push({
        thisArg: this,
        arguments: arguments
      });
      return result;
    }
    delayedFunction.calls = [];
    delayedFunction.invokeDelayed = function () {
      var call = this.calls.shift();
      result = originalFunction.apply(call.thisArg, call.arguments);
    };
    delayedFunction.invokeAll = function () {
      while (this.calls.length > 0) {
        this.invokeDelayed();
      }
    };
    return delayedFunction;
  }

  return delayedInvocationStub;
})());

mocks.config(function ($provide, $controllerProvider) {
  $provide.stubDirective = function (name, definition) {
    $provide.factory(name + 'Directive', function () {
      return [_.extend({
        name: name,
        restrict: 'A',
        priority: 0,
      }, definition)];
    });
  };

  $provide.removeDirectives = function () {
    _.flatten(arguments).forEach(function (directive) {
      var fullName = directive + 'Directive';
      $provide.factory(fullName, function () {
        return [];
      });
    });
  };

  $provide.removeControllers = function () {
    _.flatten(arguments).forEach(function (controller) {
      $controllerProvider.register(controller, angular.noop);
    });
  };

  $provide.makeStubs = function makeStubs(stubList) {
    var stubs = {};
    _.each(stubList, function (val) {
      stubs[val] = sinon.stub();
    });
    return stubs;
  };

});
