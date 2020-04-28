import _ from 'lodash';
import { createApiKeyRepo } from './ApiKeyRepo';

describe('ApiKeyRepo', () => {
  let space;
  let repo;
  let getApiKeys;
  let getPreviewApiKeys;

  beforeEach(async function () {
    getApiKeys = jest.fn();
    getPreviewApiKeys = jest.fn();
    space = {
      endpoint: jest.fn().mockImplementation((params) => {
        if (params.method === 'GET' && params.path[0] === 'api_keys') {
          return getApiKeys(params);
        }
        if (params.method === 'GET' && params.path[0] === 'preview_api_keys') {
          return getPreviewApiKeys(params);
        }
      }),
    };
    repo = createApiKeyRepo(space.endpoint);
  });

  describe('#get()', () => {
    it('calls endpoint and return correct values', async function () {
      const previewAPIKeyId = 'preview_api_key_id';

      getApiKeys.mockResolvedValue({
        accessToken: 'DELIVERY_TOKEN',
        preview_api_key: {
          sys: {
            id: previewAPIKeyId,
          },
        },
      });

      getPreviewApiKeys.mockResolvedValue({
        accessToken: 'PREVIEW_TOKEN',
      });

      const key = await repo.get('ID');
      expect(space.endpoint).toHaveBeenCalledTimes(2);
      expect(space.endpoint).toHaveBeenCalledWith({ method: 'GET', path: ['api_keys', 'ID'] });
      expect(space.endpoint).toHaveBeenCalledWith({
        method: 'GET',
        path: ['preview_api_keys', previewAPIKeyId],
      });

      expect(key).toEqual({
        accessToken: 'DELIVERY_TOKEN',
        preview_api_key: { accessToken: 'PREVIEW_TOKEN' },
      });
    });
  });
});
