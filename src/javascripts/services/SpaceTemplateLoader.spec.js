import {
  getTemplate,
  getTemplatesList,
  getClientParams,
  _resetGlobals,
} from './SpaceTemplateLoader';
import newContentfulClient from './contentfulClient';
import {
  contentTypesCDA,
  assetsCDA,
  entriesCDA,
  spaceCDA,
} from './__fixtures__/SpaceTemplateLoader';

jest.mock('./contentfulClient', () => jest.fn());

describe('SpaceTemplateLoader', () => {
  let clientGetEntriesMock, clientGetAssetsMock, clientGetCTsMock, clientGetSpaceMock;

  beforeEach(() => {
    _resetGlobals();
    clientGetEntriesMock = jest.fn();
    clientGetAssetsMock = jest.fn();
    clientGetCTsMock = jest.fn();
    clientGetSpaceMock = jest.fn();

    newContentfulClient.mockReturnValue({
      request: jest.fn(),
      entries: clientGetEntriesMock,
      assets: clientGetAssetsMock,
      contentTypes: clientGetCTsMock,
      space: clientGetSpaceMock,
    });
  });

  afterEach(async () => {
    _resetGlobals(); // so that a new client is generated for every spec
    newContentfulClient.mockReset();
  });

  describe('getClientParams', () => {
    const contentfulConfig = {
      space: 'space-id',
      accessToken: 'access-token',
      previewAccessToken: 'preview-token',
      cdaApiUrl: 'cda-api-url',
      previewApiUrl: 'preview-api-url',
    };

    describe('when env is production', () => {
      it('should return space id, cda access token and cda api url as params', () => {
        expect(
          getClientParams({
            env: 'production',
            ...contentfulConfig,
          })
        ).toEqual({
          space: contentfulConfig.space,
          accessToken: contentfulConfig.accessToken,
          host: contentfulConfig.cdaApiUrl,
        });
      });
    });

    describe('when env is anything else', () => {
      it('should return space id, preview access token and preview api url', () => {
        expect(
          getClientParams({
            env: 'dev',
            ...contentfulConfig,
          })
        ).toEqual({
          space: contentfulConfig.space,
          accessToken: contentfulConfig.previewAccessToken,
          host: contentfulConfig.previewApiUrl,
        });
      });
    });
  });

  describe('getTemplatesList', () => {
    const entries = [
      { fields: { order: 2 }, sys: { id: 'template_1234' } },
      { fields: { order: 1 }, sys: { id: 'template_2345' } },
      { fields: { order: 3 }, sys: { id: 'template_3456' } },
      { fields: {}, sys: { id: 'template_4567' } },
    ];
    const sortedResult = [
      { order: 1, sys: { id: 'template_2345' } },
      { order: 2, sys: { id: 'template_1234' } },
      { order: 3, sys: { id: 'template_3456' } },
      { sys: { id: 'template_4567' } },
    ];

    it("should instantiate a contentful client when there isn't one", async () => {
      clientGetEntriesMock.mockResolvedValue([]);
      await getTemplatesList();

      expect(newContentfulClient).toHaveBeenCalledTimes(1);
    });

    it('should instantiate the client only once', async () => {
      clientGetEntriesMock.mockResolvedValue([]);
      await getTemplatesList();
      await getTemplatesList();

      expect(newContentfulClient).toHaveBeenCalledTimes(1);
    });

    it('should fetch entries for space templates content type and return a mapped array sorted by `order`', async () => {
      clientGetEntriesMock.mockResolvedValue(entries);
      const templates = await getTemplatesList();

      // assert new client was instantiated
      expect(newContentfulClient).toHaveBeenCalledTimes(1);
      expect(clientGetEntriesMock).toHaveBeenCalledTimes(1);
      expect(clientGetEntriesMock).toHaveBeenCalledWith({
        content_type: 'space-template-ct-id', // comes from __mocks__/Config.js
      });

      expect(templates).toEqual(sortedResult);
    });

    it('should throw when something fails', async () => {
      newContentfulClient.mockImplementation((_) => {
        throw new Error();
      });

      await expect(getTemplatesList()).rejects.toThrow();

      newContentfulClient.mockReset();
      newContentfulClient.mockReturnValue({
        entries: clientGetEntriesMock,
      });
      clientGetEntriesMock.mockReset();
      clientGetEntriesMock.mockRejectedValue(new Error());

      await expect(getTemplatesList()).rejects.toThrow();
    });
  });

  describe('getTemplate', () => {
    const templateInfo = {
      spaceId: 'my-space',
      spaceApiKey: 'my-space-api-key',
      templateDeliveryApiKeys: [
        {
          fields: { name: 'apikey-1', description: 'Api Key 1' },
        },
        {
          fields: { name: 'apikey-2', description: 'Api Key 2' },
        },
      ],
    };

    beforeEach(() => {
      clientGetEntriesMock.mockReturnValue([]);
      clientGetAssetsMock.mockReturnValue([]);
      clientGetCTsMock.mockReturnValue([]);
      clientGetSpaceMock.mockReturnValue({ space: { sys: { id: 'my-space' } } });
    });

    it('should create a contentful client for the requested template', async () => {
      await getTemplate(templateInfo);

      expect(newContentfulClient).toHaveBeenCalledTimes(1);
      expect(newContentfulClient).toHaveBeenCalledWith({
        host: 'cda-api-url', // comes from __mocks__/Config.js
        space: templateInfo.spaceId,
        accessToken: templateInfo.spaceApiKey,
      });
    });

    it('should only create a contentful client once for a requested template', async () => {
      await getTemplate(templateInfo);
      await getTemplate(templateInfo);

      expect(newContentfulClient).toHaveBeenCalledTimes(1);
    });

    it('should return template space, entries, assets, CTs and api keys', async () => {
      clientGetCTsMock.mockReturnValue(contentTypesCDA);
      clientGetEntriesMock.mockReturnValue(entriesCDA);
      clientGetAssetsMock.mockReturnValue(assetsCDA);
      clientGetSpaceMock.mockReturnValue(spaceCDA);

      await getTemplate(templateInfo);
    });
  });
});
