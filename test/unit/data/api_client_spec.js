'use strict';
import _ from 'lodash';

describe('data/APIClient', () => {
  let $http;

  beforeEach(function() {
    $http = sinon.stub();
    module('contentful/test', $provide => {
      $provide.value('$http', $http);
    });

    const createSpaceEndpoint = this.$inject('data/Endpoint.es6').createSpaceEndpoint;
    const Client = this.$inject('data/APIClient.es6').default;
    const $timeout = this.$inject('$timeout');

    const auth = { getToken: sinon.stub().resolves('TOKEN') };
    const endpoint = createSpaceEndpoint('//api.test.local', 'SPACE', auth);
    this.client = new Client((...args) => {
      const response = endpoint(...args);
      $timeout.flush();
      return response;
    });
  });

  afterEach(() => {
    $http = null;
  });

  describe('single resource', () => {
    const headers = extraHeaders => {
      return _.extend(
        {},
        {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          Authorization: 'Bearer TOKEN'
        },
        extraHeaders
      );
    };

    beforeEach(() => {
      $http.resolves({ data: 'DATA' });
    });

    it('getContentType(id)', function() {
      return this.client.getContentType('ID').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/content_types/ID'
        })
      );
    });

    it('getEntry(id)', function() {
      return this.client.getEntry('ID').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/entries/ID'
        })
      );
    });

    it('getEntrySnapshot(entryId, snapshotId)', function() {
      return this.client.getEntrySnapshot('EID', 'SID').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/entries/EID/snapshots/SID'
        })
      );
    });

    it('getAsset(id)', function() {
      return this.client.getAsset('ID').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/assets/ID'
        })
      );
    });

    it('createEntry(ctId, data)', function() {
      const entry = { fields: 'MY FIELDS' };
      return this.client.createEntry('CTID', entry).then(
        assertRequestResponse('DATA', {
          method: 'POST',
          url: '//api.test.local/spaces/SPACE/entries',
          data: entry,
          headers: headers({ 'X-Contentful-Content-Type': 'CTID' })
        })
      );
    });

    it('#deleteSpace()', function() {
      return this.client.deleteSpace().then(
        assertRequestResponse(undefined, {
          method: 'DELETE',
          url: '//api.test.local/spaces/SPACE'
        })
      );
    });

    it('#renameSpace(newName, version)', function() {
      return this.client.renameSpace('NEW NAME!!!', 2).then(
        assertRequestResponse('DATA', {
          method: 'PUT',
          url: '//api.test.local/spaces/SPACE',
          data: { name: 'NEW NAME!!!' },
          headers: headers({ 'X-Contentful-Version': 2 })
        })
      );
    });
  });

  describe('resource list', () => {
    beforeEach(() => {
      $http.resolves({ data: 'DATA' });
    });

    it('getContentTypes(query)', function() {
      return this.client.getContentTypes('QUERY').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/content_types',
          params: 'QUERY'
        })
      );
    });

    it('getEntries(query)', function() {
      return this.client.getEntries('QUERY').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/entries',
          params: 'QUERY'
        })
      );
    });

    it('getEntrySnapshots(entryId, query)', function() {
      return this.client.getEntrySnapshots('EID', 'QUERY').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/entries/EID/snapshots',
          params: 'QUERY'
        })
      );
    });

    it('getAssets(query)', function() {
      return this.client.getAssets('QUERY').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/assets',
          params: 'QUERY'
        })
      );
    });

    it('getPublishedAssets(query)', function() {
      return this.client.getPublishedAssets('QUERY').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/public/assets',
          params: 'QUERY'
        })
      );
    });

    it('getPublishedEntries(query)', function() {
      return this.client.getPublishedEntries('QUERY').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/public/entries',
          params: 'QUERY'
        })
      );
    });
  });

  describe('Extensions', () => {
    beforeEach(() => {
      $http.resolves({ data: 'DATA' });
    });

    it('getExtensions()', function() {
      return this.client.getExtensions().then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/extensions'
        })
      );
    });

    it('getExtension(id)', function() {
      return this.client.getExtension('ID').then(
        assertRequestResponse('DATA', {
          method: 'GET',
          url: '//api.test.local/spaces/SPACE/extensions/ID'
        })
      );
    });

    it('createExtension(data)', function() {
      return this.client.createExtension({}).then(
        assertRequestResponse('DATA', {
          method: 'POST',
          url: '//api.test.local/spaces/SPACE/extensions'
        })
      );
    });

    it('updateExtension(data)', function() {
      return this.client.updateExtension({ sys: { id: 'ID', version: 2 } }).then(
        assertRequestResponse('DATA', {
          method: 'PUT',
          url: '//api.test.local/spaces/SPACE/extensions/ID',
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
            'X-Contentful-Version': 2,
            Authorization: 'Bearer TOKEN'
          }
        })
      );
    });

    it('deleteExtension(id)', function() {
      return this.client.deleteExtension('ID').then(
        assertRequestResponse(undefined, {
          method: 'DELETE',
          url: '//api.test.local/spaces/SPACE/extensions/ID'
        })
      );
    });
  });

  /**
   * Returns a function that makes assertions on the value of it
   * parameter and on the argument `$http` has been called with
   */
  function assertRequestResponse(resExp, reqExp) {
    return res => {
      expect(res).toEqual(resExp);
      sinon.assert.calledOnce($http);
      const req = $http.getCall(0).args[0];
      _.forEach(reqExp, (val, prop) => {
        expect(req[prop]).toEqual(val);
      });
    };
  }
});
