import { createSpaceApi } from './createSpaceApi';
import { createContentTypeApi } from './createContentTypeApi';
import { CONTENT_ENTITY_UPDATED_EVENT } from 'services/PubSubService';
import { ContentType } from 'contentful-ui-extensions-sdk';

jest.mock('Config', () => ({
  uploadApiUrl: jest.fn(() => 'example_url'),
}));

jest.mock('services/PubSubService', () => ({
  CONTENT_ENTITY_UPDATED_EVENT: 'CONTENT_ENTITY_UPDATED_EVENT',
}));

jest.mock('Authentication', () => ({
  getToken: jest.fn(() => 'fake_key'),
}));

const pubSubClient = {
  on: jest.fn(),
  off: jest.fn(),
};

const environmentIds = ['my_environment'];

const cma = {
  archiveEntry: jest.fn(),
  archiveAsset: jest.fn(),
  createContentType: jest.fn(),
  createEntry: jest.fn(),
  createAsset: jest.fn(),
  deleteAsset: jest.fn(),
  deleteContentType: jest.fn(),
  deleteEntry: jest.fn(),
  getAsset: jest.fn(),
  getAssets: jest.fn(),
  getEditorInterface: jest.fn(),
  getEditorInterfaces: jest.fn(),
  getEntry: jest.fn(),
  getEntrySnapshots: jest.fn(),
  getEntries: jest.fn(),
  getContentType: jest.fn(),
  getContentTypes: jest.fn(),
  getPublishedEntries: jest.fn(),
  getPublishedAssets: jest.fn(),
  processAsset: jest.fn(),
  publishAsset: jest.fn(),
  publishEntry: jest.fn(),
  unarchiveAsset: jest.fn(),
  unarchiveEntry: jest.fn(),
  unpublishAsset: jest.fn(),
  unpublishEntry: jest.fn(),
  updateAsset: jest.fn(),
  updateContentType: jest.fn(),
  updateEntry: jest.fn(),
};

const tagsRepo = {
  readTags: jest.fn(),
  createTag: jest.fn(),
  deleteTag: jest.fn(),
  updateTag: jest.fn(),
};

const usersRepo = {
  getAll: jest.fn(),
};
const spaceId = 'space_id';

const buildApi = (initialContentTypes: ContentType[]) =>
  createSpaceApi({
    cma,
    tagsRepo,
    usersRepo,
    spaceId,
    initialContentTypes,
    pubSubClient,
    environmentIds,
  });

describe('createSpaceApi', () => {
  describe('getCachedContentTypes', () => {
    describe('with no initial content types', () => {
      it('returns an empty array', () => {
        const spaceApi = buildApi([]);

        const result = spaceApi.getCachedContentTypes();

        expect(result.length).toEqual(0);
      });
    });

    describe('with initial content types', () => {
      it('creates a contentTypeApi for each', () => {
        const initialContentTypes = [
          {
            sys: {
              type: 'something',
              id: 'conte_type_id',
            },
            fields: [],
            displayField: 'title',
            description: 'my content type',
            disabled: false,
            id: 'content_type',
            localized: false,
            name: 'my content type',
            omitted: false,
            required: false,
            type: 'Something',
            validations: [],
          },
        ];

        const spaceApi = buildApi(initialContentTypes);

        const result = spaceApi.getCachedContentTypes();

        expect(result).toEqual(initialContentTypes.map(createContentTypeApi));
      });
    });
  });
  describe('createUpload', () => {
    it('calls fetch and returns the json response', async () => {
      const initialContentTypes = [];

      const spaceApi = buildApi(initialContentTypes);

      // @ts-ignore
      window.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn(async () => ({ foo: 'bar' })),
      }));

      // TODO: this function doesn't match the type defined here https://github.com/contentful/ui-extensions-sdk/blob/b0b7931e034362185728f0afeeb3adb96a5e83fb/lib/types.ts#L257
      const result = await spaceApi.createUpload('example data');

      expect(window.fetch).toHaveBeenCalledWith('example_url', expect.any(Object));

      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('getUsers', () => {
    it('formats and returns usrs from userRepo', async () => {
      const initialContentTypes = [];
      usersRepo.getAll.mockReturnValueOnce([
        {
          sys: {
            id: 'bob',
          },
          firstName: 'bob',
          lastName: 'cratchit',
          email: 'bob@bob.com',
          avatarUrl: 'www.example.com',
        },
        {
          sys: {
            id: 'ed',
          },
          firstName: 'ed',
          lastName: 'wood',
          email: 'ed@wood.com',
          avatarUrl: 'www.somewhere.com',
        },
      ]);

      const spaceApi = buildApi(initialContentTypes);

      expect(await spaceApi.getUsers()).toEqual({
        items: [
          {
            firstName: 'bob',
            lastName: 'cratchit',
            email: 'bob@bob.com',
            avatarUrl: 'www.example.com',
            sys: {
              id: 'bob',
              type: 'User',
            },
          },
          {
            firstName: 'ed',
            lastName: 'wood',
            email: 'ed@wood.com',
            avatarUrl: 'www.somewhere.com',
            sys: {
              id: 'ed',
              type: 'User',
            },
          },
        ],
        total: 2,
        limit: 2,
        skip: 0,
        sys: {
          type: 'Array',
        },
      });
    });
  });

  describe('waitUntilAssetProcessed', () => {
    it('returns the asset when cma.getAsset resolves', async () => {
      const initialContentTypes = [];
      const spaceApi = buildApi(initialContentTypes);

      const promise = spaceApi.waitUntilAssetProcessed('asset_id', 'en');

      cma.getAsset.mockResolvedValueOnce({
        fields: {
          file: {
            en: {
              url: 'www.example.com',
            },
          },
        },
      });

      const result = await promise;

      expect(result).toEqual({
        fields: {
          file: {
            en: {
              url: 'www.example.com',
            },
          },
        },
      });
    });
  });

  describe('onEntityChanged', () => {
    it('registers a handler with the pubsubclient', () => {
      const initialContentTypes = [];
      const spaceApi = buildApi(initialContentTypes);

      const callback = jest.fn();
      spaceApi.onEntityChanged('Entry', 'my_entity', callback);

      expect(pubSubClient.on).toHaveBeenCalledWith(
        CONTENT_ENTITY_UPDATED_EVENT,
        expect.any(Function)
      );
    });

    describe('when the handler is called', () => {
      it('the callback is called with the result of getEntity', async () => {
        const initialContentTypes = [];
        const spaceApi = buildApi(initialContentTypes);

        const callback = jest.fn();
        spaceApi.onEntityChanged('Entry', 'my_entity', callback);
        cma.getEntry.mockResolvedValueOnce('data');

        await pubSubClient.on.mock.calls[0][1]({
          environmentId: environmentIds[0],
          entityType: 'Entry',
          entityId: 'my_entity',
        });

        expect(callback).toHaveBeenCalledWith('data');
      });
    });
  });
});
