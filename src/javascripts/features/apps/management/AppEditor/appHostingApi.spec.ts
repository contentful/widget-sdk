import { createUploadRequest, createBundleFromUpload } from './appHostingApi';
import { AppDefinitionWithBundle } from './AppHosting';
import { Notification } from '@contentful/forma-36-react-components';
import { AppUploadData } from './types';
import axios from 'axios';
jest.mock('axios');

const definitionData = {
  sys: {
    id: 'definition_id',
    organization: {
      sys: {
        id: 'dummy_org_id',
      },
    },
  },
};

const mockAppDefintionEndpoint = jest.fn(() => 'fake response');
jest.mock('data/Endpoint', () => ({
  createAppDefinitionsEndpoint: () => mockAppDefintionEndpoint,
}));

jest.mock('Authentication', () => ({
  getToken: jest.fn(() => 'fake_key'),
}));

jest.mock('@contentful/forma-36-react-components', () => ({
  Notification: {
    warning: jest.fn(),
    success: jest.fn(),
  },
}));

const filedata = [new File([''], 'filename', { type: 'application/zip' })];

describe('createUploadRequest', () => {
  beforeEach(() => {
    (axios.CancelToken.source as jest.Mock).mockImplementation(() => ({
      token: 'token',
      cancel: jest.fn(),
    }));
    (axios.post as jest.Mock).mockImplementation(async () => ({
      data: { sys: { id: 'example_upload_id' } },
    }));
  });

  it('calls fetch and returns the json response', async () => {
    const progressListeners = [jest.fn()];
    const cancelToken = {} as any;
    await createUploadRequest(
      filedata,
      definitionData as AppDefinitionWithBundle,
      progressListeners,
      cancelToken
    );

    expect(axios.post).toHaveBeenCalledWith(
      'upload.test.com',
      expect.any(Object),
      expect.any(Object)
    );
  });
});

const exampleBundle = {
  sys: {
    id: '7tStwhBjxxXQmo7i2YB7sS',
    type: 'AppBundle',
  },
  files: [
    {
      name: 'asset-manifest.json',
      md5: 'eeU5CK4O4hCJRSlCDgFn5A==',
      size: 1232,
    },
  ],
};
describe('createBundleFromUpload', () => {
  let originalFetch: any;
  beforeEach(() => {
    originalFetch = window.fetch;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn(async () => exampleBundle),
    }));
  });
  afterEach(() => {
    window.fetch = originalFetch;
  });

  it('creates a bundle with the upload id', async () => {
    await createBundleFromUpload(
      definitionData as AppDefinitionWithBundle,
      { sys: { id: 'example_upload_id' } } as AppUploadData,
      undefined
    );

    expect(mockAppDefintionEndpoint).toHaveBeenCalledWith({
      data: {
        upload: {
          sys: { id: 'example_upload_id', linkType: 'AppUpload', type: 'Link' },
        },
      },
      method: 'POST',
      path: [definitionData.sys.id, 'app_bundles'],
    });
    expect(Notification.success).toHaveBeenCalled();
  });

  describe('when a comment is included', () => {
    it('creates a bundle with the upload id and that comment', async () => {
      await createBundleFromUpload(
        definitionData as AppDefinitionWithBundle,
        { sys: { id: 'example_upload_id' } } as AppUploadData,
        'my nice app bundle comment'
      );

      expect(mockAppDefintionEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            comment: 'my nice app bundle comment',
            upload: {
              sys: { id: 'example_upload_id', linkType: 'AppUpload', type: 'Link' },
            },
          },
        })
      );
      expect(Notification.success).toHaveBeenCalled();
    });
  });

  describe('when an empty comment is included', () => {
    it('creates a bundle with the upload id with no comment', async () => {
      await createBundleFromUpload(
        definitionData as AppDefinitionWithBundle,
        { sys: { id: 'example_upload_id' } } as AppUploadData,
        ''
      );

      expect(mockAppDefintionEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            upload: {
              sys: { id: 'example_upload_id', linkType: 'AppUpload', type: 'Link' },
            },
          },
        })
      );
      expect(Notification.success).toHaveBeenCalled();
    });
  });
});
