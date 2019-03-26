import {
  getTemplate,
  getTemplatesList,
  getClientParams,
  _resetGlobals
} from './SpaceTemplateLoader.es6';
import { getModule } from 'NgRegistry.es6';
import { contentTypesCDA, assetsCDA, entriesCDA, spaceCDA } from 'fixtures/SpaceTemplateLoader.es6';

jest.mock(
  'ng/contentfulClient',
  _ => ({
    newClient: jest.fn()
  }),
  { virtual: true }
);

describe('SpaceTemplateLoader', () => {
  const contentfulClient = getModule('contentfulClient');
  const clientGetEntriesMock = jest.fn();
  const clientGetAssetsMock = jest.fn();
  const clientGetCTsMock = jest.fn();
  const clientGetSpaceMock = jest.fn();

  beforeEach(() => {
    contentfulClient.newClient.mockReturnValue({
      entries: clientGetEntriesMock,
      assets: clientGetAssetsMock,
      contentTypes: clientGetCTsMock,
      space: clientGetSpaceMock
    });
  });

  afterEach(async () => {
    _resetGlobals(); // so that a new client is generated for every spec
    contentfulClient.newClient.mockReset();
    clientGetEntriesMock.mockReset();
    clientGetAssetsMock.mockReset();
    clientGetCTsMock.mockReset();
    clientGetSpaceMock.mockReset();
  });

  describe('getClientParams', () => {
    const contentfulConfig = {
      space: 'space-id',
      accessToken: 'access-token',
      previewAccessToken: 'preview-token',
      cdaApiUrl: 'cda-api-url',
      previewApiUrl: 'preview-api-url'
    };

    describe('when env is production', () => {
      it('should return space id, cda access token and cda api url as params', () => {
        expect(
          getClientParams({
            env: 'production',
            ...contentfulConfig
          })
        ).toEqual({
          space: contentfulConfig.space,
          accessToken: contentfulConfig.accessToken,
          host: contentfulConfig.cdaApiUrl
        });
      });
    });

    describe('when env is anything else', () => {
      it('shold return space id, preview access token and preview api url', () => {
        expect(
          getClientParams({
            env: 'dev',
            ...contentfulConfig
          })
        ).toEqual({
          space: contentfulConfig.space,
          accessToken: contentfulConfig.previewAccessToken,
          host: contentfulConfig.previewApiUrl
        });
      });
    });
  });

  describe('getTemplatesList', () => {
    const entries = [
      { fields: { order: 2 } },
      { fields: { order: 1 } },
      { fields: { order: 3 } },
      { fields: {} }
    ];
    const sortedEntries = [
      { fields: { order: 1 } },
      { fields: { order: 2 } },
      { fields: { order: 3 } },
      { fields: {} }
    ];

    it("should instantiate a contentful client when there isn't one", async () => {
      clientGetEntriesMock.mockResolvedValue([]);
      const _templates = await getTemplatesList();

      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
    });

    it('should instantiate the client only once', async () => {
      clientGetEntriesMock.mockResolvedValue([]);
      await getTemplatesList();
      await getTemplatesList();

      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
    });

    it('should fetch entries for space templates content type and return them sorted by fields.order', async () => {
      clientGetEntriesMock.mockResolvedValue(entries);
      const templates = await getTemplatesList();

      // assert new client was instantiated
      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
      expect(clientGetEntriesMock).toHaveBeenCalledTimes(1);
      expect(clientGetEntriesMock).toHaveBeenCalledWith({
        content_type: 'space-template-ct-id' // comes from __mocks__/Config.es6.js
      });
      expect(templates).toEqual(sortedEntries);
    });

    it('should throw when something fails', () => {
      contentfulClient.newClient.mockImplementation(_ => {
        throw new Error();
      });

      expect(getTemplatesList()).rejects.toThrow();

      contentfulClient.newClient.mockReset();
      contentfulClient.newClient.mockReturnValue({
        entries: clientGetEntriesMock
      });
      clientGetEntriesMock.mockReset();
      clientGetEntriesMock.mockRejectedValue(new Error());

      expect(getTemplatesList()).rejects.toThrow();
    });
  });

  describe('getTemplate', () => {
    const templateInfo = {
      spaceId: 'my-space',
      spaceApiKey: 'my-space-api-key',
      templateDeliveryApiKeys: [
        {
          fields: { name: 'apikey-1', description: 'Api Key 1' }
        },
        {
          fields: { name: 'apikey-2', description: 'Api Key 2' }
        }
      ]
    };

    beforeEach(() => {
      clientGetEntriesMock.mockReturnValue([]);
      clientGetAssetsMock.mockReturnValue([]);
      clientGetCTsMock.mockReturnValue([]);
      clientGetSpaceMock.mockReturnValue({ space: { sys: { id: 'my-space' } } });
    });

    it('should create a contentful client for the requested template', async () => {
      const _template = await getTemplate(templateInfo);

      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
      expect(contentfulClient.newClient).toHaveBeenCalledWith({
        host: 'cda-api-url', // comes from __mocks__/Config.es6.js
        space: templateInfo.spaceId,
        accessToken: templateInfo.spaceApiKey
      });
    });

    it('should only create a contentful client once for a requested template', async () => {
      await getTemplate(templateInfo);
      await getTemplate(templateInfo);

      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
    });

    it('should return template space, entries, assets, CTs and api keys', async () => {
      clientGetCTsMock.mockReturnValue(contentTypesCDA);
      clientGetEntriesMock.mockReturnValue(entriesCDA);
      clientGetAssetsMock.mockReturnValue(assetsCDA);
      clientGetSpaceMock.mockReturnValue(spaceCDA);

      const template = await getTemplate(templateInfo);

      expect(template).toMatchSnapshot();
    });
  });
});
