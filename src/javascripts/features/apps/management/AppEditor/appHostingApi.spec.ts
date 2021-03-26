import { createAppBundleFromFile } from './appHostingApi';
import { AppDefinitionWithBundle } from './AppHosting';

const definitionData = {
  sys: {
    organization: {
      sys: {
        id: 'dummy_org_id',
      },
    },
  },
};

jest.mock('data/Endpoint', () => ({
  createAppDefinitionsEndpoint: () => jest.fn(() => 'fake response'),
}));

jest.mock('Authentication', () => ({
  getToken: jest.fn(() => 'fake_key'),
}));

const filedata = new File([''], 'filename', { type: 'text/html' });

describe('CreateAppBundleFromFile', () => {
  let originalFetch: any;
  beforeEach(() => {
    originalFetch = window.fetch;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    window.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn(async () => ({ sys: { id: 'example_upload_id' } })),
    }));
  });
  afterEach(() => {
    window.fetch = originalFetch;
  });

  it('calls fetch and returns the json response', async () => {
    await createAppBundleFromFile(definitionData as AppDefinitionWithBundle, filedata);

    expect(window.fetch).toHaveBeenCalledWith('upload.test.com', expect.any(Object));
  });
});
