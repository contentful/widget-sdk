import {
  _getTemplate,
  getTemplatesList,
  getClientParams,
  resetContentfulClient
} from './SpaceTemplateLoader.es6';
import { getModule } from 'NgRegistry.es6';

jest.mock(
  'ng/contentfulClient',
  _ => ({
    newClient: jest.fn()
  }),
  { virtual: true }
);

describe('SpaceTemplateLoader', () => {
  const contentfulClient = getModule('contentfulClient');
  const clientEntriesFn = jest.fn();

  beforeEach(() => {
    contentfulClient.newClient.mockReturnValue({
      entries: clientEntriesFn
    });
  });

  afterEach(async () => {
    resetContentfulClient(); // so that a new client is generated for every spec
    clientEntriesFn.mockReset();
    contentfulClient.newClient.mockReset();
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
      clientEntriesFn.mockResolvedValue([]);
      const _templates = await getTemplatesList();

      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
    });

    it('should instantiate the client only once', async () => {
      clientEntriesFn.mockResolvedValue([]);
      await getTemplatesList();
      await getTemplatesList();

      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
    });

    it('should fetch entries for space templates content type and return them sorted by fields.order', async () => {
      clientEntriesFn.mockResolvedValue(entries);
      const templates = await getTemplatesList();

      // assert new client was instantiated
      expect(contentfulClient.newClient).toHaveBeenCalledTimes(1);
      expect(clientEntriesFn).toHaveBeenCalledTimes(1);
      expect(clientEntriesFn).toHaveBeenCalledWith({
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
        entries: clientEntriesFn
      });
      clientEntriesFn.mockReset();
      clientEntriesFn.mockRejectedValue(new Error());

      expect(getTemplatesList()).rejects.toThrow();
    });
  });

  // TODO: Tests for getTemplate
});
