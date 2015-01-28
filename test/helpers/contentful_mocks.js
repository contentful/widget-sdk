'use strict';


var mocks = angular.module('contentful/mocks', []);

mocks.factory('TestingAdapter', function ($q) {
  function Adapter() {
    this.requests = [];
  }

  Adapter.prototype = {
    requests: null, // initialized in constructor

    request: function(options) {
      var self = this;
      var deferred = $q.defer();
      self.requests.push({
        options: options,
        resolve: _.bind(deferred.resolve, deferred),
        reject:  _.bind(deferred.reject , deferred)
      });
      return deferred.promise;
    },

    resolve: function (value) {
      var req = this.requests.shift();
      req.resolve(value);
    },

    resolveLast: function(value) {
      var req = this.requests.pop();
      this.requests.length = 0;
      req.resolve(value);
    },

    reject: function (error) {
      var req = this.requests.shift();
      req.reject(error);
    },

    rejectLast: function(value) {
      var req = this.requests.pop();
      this.requests.length = 0;
      req.resolve(value);
    }
  };

  return Adapter;
});

mocks.factory('cfStub', function ($injector) {
  var $rootScope       = $injector.get('$rootScope');
  var SpaceContext     = $injector.get('SpaceContext');
  var contentfulClient = $injector.get('privateContentfulClient');
  var Adapter          = $injector.get('TestingAdapter');

  var Client = contentfulClient.Client;
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
    client.getSpace(id)
    .then(function(space) {
      testSpace = space;
    });
    adapter.resolveLast(_.merge({
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
    $rootScope.$apply();
    return testSpace;
  };

  cfStub.spaceContext = function (space, contentTypes) {
    var spaceContext = new SpaceContext(space);
    spaceContext.refreshContentTypes();
    adapter.resolveLast({
      sys: {
        type: 'Array'
      },
      items: contentTypes,
      total: contentTypes.length
    });
    $rootScope.$apply();
    adapter.resolveLast({
      sys: {
        type: 'Array'
      },
      items: contentTypes,
      total: contentTypes.length
    });
    $rootScope.$apply();
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
    space.getContentType(id)
    .then(function(res){
      contentType = res;
    });
    var data = cfStub.contentTypeData(id, fields, {
      name: name,
      sys: { version: 1 }
    });
    adapter.resolveLast(_.merge(data, extraData || {}));
    $rootScope.$apply();
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
    space.getEntry(id)
    .then(function (res) {
      entry = res;
    });
    adapter.resolveLast(_.merge({
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
    $rootScope.$apply();
    return entry;
  };

  cfStub.asset = function (space, id, fields, extraData) {
    var asset;
    space.getAsset(id).then(function (res) {
      asset = res;
    });
    adapter.resolveLast(_.merge({
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
    $rootScope.$apply();
    return asset;
  };

  cfStub.apiKey = function (space, id, name, extraData) {
    var apiKey;
    space.getDeliveryApiKey(id).then(function (res) {
      apiKey = res;
    });
    adapter.resolveLast(_.merge({
      name: name,
      sys: {
        id: id,
        version: 1,
        type: 'ApiKey',
      }
    }, extraData || {}));
    $rootScope.$apply();
    return apiKey;
  };

  cfStub.collection = function (items, total) {
    if (_.isNumber(items)) items = new Array(items);
    total = total === undefined ? items.length : total;
    Object.defineProperty(items, 'total', {value: total});
    return items;
  };

  return cfStub;
});

mocks.config(['$provide', function ($provide) {
  $provide.value('$exceptionHandler', function(e){
    throw e;
  });

  $provide.decorator('ShareJS', ['$delegate', function ($delegate) {
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
  }]);

  $provide.decorator('ReloadNotification', ['$delegate', function ($delegate) {
    for (var prop in $delegate) {
      sinon.stub($delegate, prop);
    }
    return $delegate;
  }]);

  $provide.provider('realLogger', function(loggerProvider){
    return loggerProvider;
  });

  $provide.provider('realNotification', function(notificationProvider){
    return notificationProvider;
  });

  $provide.factory('logger', function(){
    return {
      logException:    sinon.stub(),
      logError:        sinon.stub(),
      logServerError:  sinon.stub(),
      logServerWarn:   sinon.stub(),
      logWarn:         sinon.stub(),
      log:             sinon.stub()
    };
  });

  $provide.factory('notification', function(){
    return {
      error: sinon.stub(),
      warn:  sinon.stub(),
      info:  sinon.stub(),
    };
  });

  //$provide.decorator('logger', function($delegate){
    //sinon.stub($delegate, '_log');
    //return $delegate;
  //});

  //$provide.decorator('notification', function($delegate){
    //sinon.stub($delegate, '_notify')
  //});
}]);

mocks.config(function ($provide) {
  $provide.value('debounce', immediateInvocationStub);
  $provide.value('throttle', immediateInvocationStub);
  $provide.value('defer',    noDeferStub);
  $provide.value('delay',    noDelayStub);
  $provide.constant('noDeferStub', noDeferStub);
  $provide.constant('noDelayStub', noDelayStub);
  $provide.constant('delayedInvocationStub', delayedInvocationStub);
  $provide.constant('immediateInvocationStub', immediateInvocationStub);

  function noDeferStub(f) {
    /*jshint validthis:true */
    var args = _.rest(arguments);
    f.apply(this, args);
  }

  function noDelayStub(f/*, delay*/) {
    /*jshint validthis:true */
    var args = _.rest(arguments, 2);
    f.apply(this, args);
  }

  function immediateInvocationStub(f) {
    return f;
  }

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
});

mocks.config(['$provide', '$controllerProvider', function ($provide, $controllerProvider) {
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

  $provide.removeController = function (label, fakeController) {
    $controllerProvider.register(label, fakeController || angular.noop);
  };

  $provide.removeControllers = function () {
    _.flatten(arguments).forEach(function (controller) {
      $controllerProvider.register(controller, angular.noop);
    });
  };

  $provide.stubFilter = function (filterName, returnValue) {
    $provide.value(filterName+'Filter', function () {return returnValue || '';});
  };

  $provide.makeStubs = function makeStubs(stubList) {
    if(!_.isArray(stubList)) stubList = _.flatten(arguments);
    var stubs = {};
    _.each(stubList, function (val) {
      stubs[val] = sinon.stub();
    });
    return stubs;
  };

}]);
