import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('data/APIClient', () => {
  let $http;

  beforeEach(async function() {
    $http = sinon.stub();

    const { createSpaceEndpoint } = await this.system.import('data/Endpoint');
    const { default: Client } = await this.system.import('data/APIClient');

    await $initialize(this.system, $provide => {
      $provide.value('$http', $http);
    });

    const $timeout = $inject('$timeout');

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

    it('getContentType(id)', async function() {
      const result = await this.client.getContentType('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/content_types/ID'
      })(result);
    });

    it('getEntry(id)', async function() {
      const result = await this.client.getEntry('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries/ID'
      })(result);
    });

    it('getEntrySnapshot(entryId, snapshotId)', async function() {
      const result = await this.client.getEntrySnapshot('EID', 'SID');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries/EID/snapshots/SID'
      })(result);
    });

    it('getAsset(id)', async function() {
      const result = await this.client.getAsset('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/assets/ID'
      })(result);
    });

    it('createEntry(ctId, data)', async function() {
      const entry = { fields: 'MY FIELDS' };
      const result = await this.client.createEntry('CTID', entry);

      assertRequestResponse('DATA', {
        method: 'POST',
        url: '//api.test.local/spaces/SPACE/entries',
        data: entry,
        headers: headers({ 'X-Contentful-Content-Type': 'CTID' })
      })(result);
    });

    it('#deleteSpace()', async function() {
      const result = await this.client.deleteSpace();

      assertRequestResponse(undefined, {
        method: 'DELETE',
        url: '//api.test.local/spaces/SPACE'
      })(result);
    });

    it('#renameSpace(newName, version)', async function() {
      const result = await this.client.renameSpace('NEW NAME!!!', 2);

      assertRequestResponse('DATA', {
        method: 'PUT',
        url: '//api.test.local/spaces/SPACE',
        data: { name: 'NEW NAME!!!' },
        headers: headers({ 'X-Contentful-Version': 2 })
      })(result);
    });
  });

  describe('resource list', () => {
    beforeEach(() => {
      $http.resolves({ data: 'DATA' });
    });

    it('getContentTypes(query)', async function() {
      const result = await this.client.getContentTypes('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/content_types',
        params: 'QUERY'
      })(result);
    });

    it('getEntries(query)', async function() {
      const result = await this.client.getEntries('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries',
        params: 'QUERY'
      })(result);
    });

    it('getEntrySnapshots(entryId, query)', async function() {
      const result = await this.client.getEntrySnapshots('EID', 'QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/entries/EID/snapshots',
        params: 'QUERY'
      })(result);
    });

    it('getEditorInterfaces()', async function() {
      const result = await this.client.getEditorInterfaces();

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/editor_interfaces'
      })(result);
    });

    it('getAssets(query)', async function() {
      const result = await this.client.getAssets('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/assets',
        params: 'QUERY'
      })(result);
    });

    it('getPublishedAssets(query)', async function() {
      const result = await this.client.getPublishedAssets('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/public/assets',
        params: 'QUERY'
      })(result);
    });

    it('getPublishedEntries(query)', async function() {
      const result = await this.client.getPublishedEntries('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/public/entries',
        params: 'QUERY'
      })(result);
    });
  });

  describe('Extensions', () => {
    beforeEach(() => {
      $http.resolves({ data: 'DATA' });
    });

    it('getExtensions()', async function() {
      const result = await this.client.getExtensions();

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/proxied_extensions'
      })(result);
    });

    it('getExtension(id)', async function() {
      const result = await this.client.getExtension('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        url: '//api.test.local/spaces/SPACE/proxied_extensions/ID'
      })(result);
    });

    it('createExtension(data)', async function() {
      const result = await this.client.createExtension({});

      assertRequestResponse('DATA', {
        method: 'POST',
        url: '//api.test.local/spaces/SPACE/proxied_extensions'
      })(result);
    });

    it('updateExtension(data)', async function() {
      const result = await this.client.updateExtension({ sys: { id: 'ID', version: 2 } });

      assertRequestResponse('DATA', {
        method: 'PUT',
        url: '//api.test.local/spaces/SPACE/proxied_extensions/ID',
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'X-Contentful-Version': 2,
          Authorization: 'Bearer TOKEN'
        }
      })(result);
    });

    it('deleteExtension(id)', async function() {
      const result = await this.client.deleteExtension('ID');

      assertRequestResponse(undefined, {
        method: 'DELETE',
        url: '//api.test.local/spaces/SPACE/proxied_extensions/ID'
      })(result);
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
