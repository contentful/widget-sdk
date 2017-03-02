'use strict';

describe('data/ApiClient', function () {
  let $http;

  beforeEach(function () {
    $http = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('$http', $http);
    });

    const SpaceEndpoint = this.$inject('data/spaceEndpoint');
    const Client = this.$inject('data/ApiClient');
    const $timeout = this.$inject('$timeout');

    const auth = { getToken: sinon.stub().resolves('TOKEN') };
    const endpoint = SpaceEndpoint.create('//api.test.local', 'SPACE', auth);
    this.client = new Client(function (...args) {
      const response = endpoint(...args);
      $timeout.flush();
      return response;
    });
  });

  afterEach(function () {
    $http = null;
  });

  describe('single resource', function () {
    const headers = (extraHeaders) => {
      return _.extend({}, {
        'Content-Type': 'application/vnd.contentful.management.v1+json',
        Authorization: 'Bearer TOKEN'
      }, extraHeaders);
    };

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

    pit('getEntrySnapshot(entryId, snapshotId)', function () {
      return this.client.getEntrySnapshot('EID', 'SID')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries/EID/snapshots/SID'
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
      const entry = {'fields': 'MY FIELDS'};
      return this.client.createEntry('CTID', entry)
      .then(assertRequestResponse('DATA', {
        method: 'POST',
        url: '//api.test.local/spaces/SPACE/entries',
        data: entry,
        headers: headers({'X-Contentful-Content-Type': 'CTID'})
      }));
    });

    pit('#deleteSpace()', function () {
      return this.client.deleteSpace()
      .then(assertRequestResponse(undefined, {
        method: 'DELETE',
        url: '//api.test.local/spaces/SPACE'
      }));
    });

    pit('#renameSpace(newName, version)', function () {
      return this.client.renameSpace('NEW NAME!!!', 2)
      .then(assertRequestResponse('DATA', {
        method: 'PUT',
        url: '//api.test.local/spaces/SPACE',
        data: {name: 'NEW NAME!!!'},
        headers: headers({'X-Contentful-Version': 2})
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

    pit('getEntrySnapshots(entryId, query)', function () {
      return this.client.getEntrySnapshots('EID', 'QUERY')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries/EID/snapshots',
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

    pit('getPublishedAssets(query)', function () {
      return this.client.getPublishedAssets('QUERY')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/public/assets',
        params: 'QUERY'
      }));
    });

    pit('getPublishedEntries(query)', function () {
      return this.client.getPublishedEntries('QUERY')
      .then(assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/public/entries',
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
      const req = $http.getCall(0).args[0];
      _.forEach(reqExp, function (val, prop) {
        expect(req[prop]).toEqual(val);
      });
    };
  }
});
