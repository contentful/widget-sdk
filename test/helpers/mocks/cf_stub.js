'use strict';


angular.module('contentful/mocks')

.factory('TestingAdapter', $q => {
  function Adapter () {
    this.requests = [];
  }

  Adapter.prototype = {
    requests: null, // initialized in constructor

    request: function (options) {
      const self = this;
      const deferred = $q.defer();
      self.requests.push({
        options: options,
        resolve: _.bind(deferred.resolve, deferred),
        reject: _.bind(deferred.reject, deferred)
      });
      return deferred.promise;
    },

    resolve: function (value) {
      const req = this.requests.shift();
      req.resolve(value);
    },

    resolveLast: function (value) {
      const req = this.requests.pop();
      this.requests.length = 0;
      req.resolve(value);
    },

    reject: function (error) {
      const req = this.requests.shift();
      req.reject(error);
    },

    rejectLast: function (value) {
      const req = this.requests.pop();
      this.requests.length = 0;
      req.resolve(value);
    }
  };

  return Adapter;
})

.factory('cfStub', $injector => {
  const $rootScope = $injector.get('$rootScope');
  const spaceContext = $injector.get('spaceContext');
  const Client = $injector.get('legacy-client');
  const Adapter = $injector.get('TestingAdapter');

  const adapter = new Adapter();

  const cfStub = {};
  cfStub.adapter = adapter;

  cfStub.locale = (code, extraData) => _.extend({
    code: code,
    internal_code: code,
    contentDeliveryApi: true,
    contentManagementApi: true,
    'default': true,
    name: code
  }, extraData || {});

  cfStub.locales = function () {
    return _.map(arguments, (code, index) => cfStub.locale(code, {'default': index === 0}));
  };

  cfStub.space = (id, extraData) => {
    id = id || 'testSpace';

    return (new Client(adapter)).newSpace(_.merge({
      sys: {
        id: id,
        createdBy: { sys: {id: 123} }
      },
      locales: cfStub.locales('en-US', 'de-DE'),
      organization: {
        sys: {
          id: '456',
          type: 'Organization'
        },
        usage: {},
        subscription: {},
        subscriptionPlan: {limits: {}}
      },
      spaceMembership: {
        isAdmin: true
      }
    }, extraData || {}));
  };

  cfStub.mockSpaceContext = () => {
    const spaceData = cfStub.space('test').data;
    const contentTypeData = cfStub.contentTypeData('testType');
    spaceContext.resetWithSpace(spaceData);
    spaceContext.space.getContentTypes = sinon.stub().resolves([contentTypeData]);
    return spaceContext;
  };

  cfStub.contentTypeData = (id, fields, extraData) => {
    fields = fields || [];
    return _.merge({
      fields: fields,
      sys: {
        id: id,
        type: 'ContentType'
      }
    }, extraData || {});
  };

  cfStub.contentType = (space, id, name, fields, extraData) => {
    const data = cfStub.contentTypeData(id, fields, {
      name: name,
      sys: { version: 1 }
    });
    _.merge(data, extraData || {});
    return space.newContentType(data);
  };

  cfStub.entry = (space, id, contentTypeId, fields, extraData) => {
    fields = fields || {};
    let entry;
    space.getEntry(id)
    .then(res => {
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

  cfStub.asset = (space, id, fields, extraData) => {
    let asset;
    space.getAsset(id).then(res => {
      asset = res;
    });
    adapter.resolveLast(_.merge({
      sys: {
        id: id,
        type: 'Asset',
        version: 1
      },
      fields: _.merge({
        title: {},
        description: {},
        file: {}
      }, fields || {})
    }, extraData || {}));
    $rootScope.$apply();
    return asset;
  };

  return cfStub;
});
