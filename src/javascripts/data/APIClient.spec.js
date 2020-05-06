import APIClient from './APIClient';
import { forEach } from 'lodash';

const mockEndpoint = jest.fn(async () => 'DATA');
const client = new APIClient(mockEndpoint);

/**
 * Returns a function that makes assertions on the parameters and headers
 * passed to the spance Endpoint insance
 */
function assertRequestResponse(resExp, reqExp, headersExp) {
  return (res) => {
    expect(res).toEqual(resExp);
    expect(mockEndpoint).toHaveBeenCalledTimes(1);

    const req = mockEndpoint.mock.calls[0][0];
    const headers = mockEndpoint.mock.calls[0][1];

    forEach(reqExp, (val, prop) => {
      expect(req[prop]).toEqual(val);
    });

    expect(headers).toEqual(headersExp);
  };
}

describe('APIClient', () => {
  describe('single resource', () => {
    it('getContentType(id)', async function () {
      const result = await client.getContentType('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['content_types', 'ID'],
      })(result);
    });

    it('getEntry(id)', async function () {
      const result = await client.getEntry('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['entries', 'ID'],
      })(result);
    });

    it('getEntrySnapshot(entryId, snapshotId)', async function () {
      const result = await client.getEntrySnapshot('EID', 'SID');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['entries', 'EID', 'snapshots', 'SID'],
      })(result);
    });

    it('getAsset(id)', async function () {
      const result = await client.getAsset('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['assets', 'ID'],
      })(result);
    });

    it('createEntry(ctId, data)', async function () {
      const entry = { fields: 'MY FIELDS' };
      const result = await client.createEntry('CTID', entry);

      assertRequestResponse(
        'DATA',
        {
          method: 'POST',
          path: ['entries', undefined],
          data: entry,
        },
        expect.objectContaining({ 'X-Contentful-Content-Type': 'CTID' })
      )(result);
    });

    it('#deleteSpace()', async function () {
      const result = await client.deleteSpace();

      assertRequestResponse(undefined, {
        method: 'DELETE',
        path: undefined,
      })(result);
    });

    it('#renameSpace(newName, version)', async function () {
      const result = await client.renameSpace('NEW NAME!!!', 2);

      assertRequestResponse('DATA', {
        method: 'PUT',
        path: undefined,
        data: { name: 'NEW NAME!!!' },
        version: 2,
      })(result);
    });
  });

  describe('resource list', () => {
    it('getContentTypes(query)', async function () {
      const result = await client.getContentTypes('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['content_types'],
        query: 'QUERY',
      })(result);
    });

    it('getEntries(query)', async function () {
      const result = await client.getEntries('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['entries'],
        query: 'QUERY',
      })(result);
    });

    it('getEntrySnapshots(entryId, query)', async function () {
      const result = await client.getEntrySnapshots('EID', 'QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['entries', 'EID', 'snapshots'],
        query: 'QUERY',
      })(result);
    });

    it('getEditorInterfaces()', async function () {
      const result = await client.getEditorInterfaces();

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['editor_interfaces'],
      })(result);
    });

    it('getAssets(query)', async function () {
      const result = await client.getAssets('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['assets'],
        query: 'QUERY',
      })(result);
    });

    it('getPublishedAssets(query)', async function () {
      const result = await client.getPublishedAssets('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['public/assets'],
        query: 'QUERY',
      })(result);
    });

    it('getPublishedEntries(query)', async function () {
      const result = await client.getPublishedEntries('QUERY');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['public/entries'],
        query: 'QUERY',
      })(result);
    });
  });

  describe('Extensions', () => {
    it('getExtensions()', async function () {
      const result = await client.getExtensions();

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['extensions'],
      })(result);
    });

    it('getExtension(id)', async function () {
      const result = await client.getExtension('ID');

      assertRequestResponse('DATA', {
        method: 'GET',
        path: ['extensions', 'ID'],
      })(result);
    });

    it('createExtension(data)', async function () {
      const result = await client.createExtension({});

      assertRequestResponse('DATA', {
        method: 'POST',
        path: ['extensions', undefined],
      })(result);
    });

    it('updateExtension(data)', async function () {
      const result = await client.updateExtension({ sys: { id: 'ID', version: 2 } });

      assertRequestResponse('DATA', {
        method: 'PUT',
        path: ['extensions', 'ID'],
        version: 2,
      })(result);
    });

    it('deleteExtension(id)', async function () {
      const result = await client.deleteExtension('ID');

      assertRequestResponse(undefined, {
        method: 'DELETE',
        path: ['extensions', 'ID'],
      })(result);
    });
  });
});
