'use strict';

describe('data/ApiClient', function () {
  var $http;

  beforeEach(function () {
    $http = sinon.stub();
    module('cf.data', function ($provide) {
      $provide.value('$http', $http);
      $provide.constant('environment', {
        settings: {api_host: 'api.test.local'}
      });
    });

    var SpaceEndpoint = this.$inject('data/spaceEndpoint');
    var Client = this.$inject('data/ApiClient');
    var makeRequest = SpaceEndpoint.create('TOKEN', '//api.test.local', 'SPACE');
    this.client = new Client(makeRequest);
  });

  afterEach(function () {
    $http = null;
  });

  describe('single resource', function () {

    beforeEach(function () {
      $http.resolves({data: 'DATA'});
    });

    pit('getContentType(id)', function () {
      return this.client.getContentType('ID')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/content_types/ID'
      }));
    });

    pit('getEntry(id)', function () {
      return this.client.getEntry('ID')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries/ID'
      }));
    });

    pit('getAsset(id)', function () {
      return this.client.getAsset('ID')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/assets/ID'
      }));
    });

    pit('createEntry(ctId, data)', function () {
      var entry = {'fields': 'MY FIELDS'};
      return this.client.createEntry('CTID', entry)
      .then(assertRequestResponse('DATA', {
        method: 'POST',
        url: '//api.test.local/spaces/SPACE/entries',
        data: entry,
        headers: {
          'X-Contentful-Content-Type': 'CTID',
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'Authorization': 'Bearer TOKEN'
        }
      }));
    });
  });

  describe('resource list', function () {

    beforeEach(function () {
      $http.resolves({data: 'DATA'});
    });

    pit('getContentTypes(query)', function () {
      return this.client.getContentTypes('QUERY')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/content_types',
        params: 'QUERY'
      }));
    });

    pit('getEntries(query)', function () {
      return this.client.getEntries('QUERY')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries',
        params: 'QUERY'
      }));
    });

    pit('getAssets(query)', function () {
      return this.client.getAssets('QUERY')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/assets',
        params: 'QUERY'
      }));
    });

  });

  /**
   * Returns a function that makes assertions on the value of it
   * parameter and on the argument `$http` has been called with
   */
  function assertRequestResponse (resExp, reqExp) {
    return function (res) {
      expect(res).toEqual(resExp);
      sinon.assert.calledOnce($http);
      var req = $http.getCall(0).args[0];
      _.forEach(reqExp, function (val, prop) {
        expect(req[prop]).toEqual(val);
      });
    };
  }
});
