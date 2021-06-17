import createResourceService from './ResourceService';
import { mockEndpoint } from 'data/EndpointFactory';
import {
  canCreate,
  canCreateResources,
  generateMessage,
  getEnvironmentResources,
} from 'utils/ResourceUtils';

jest.mock('utils/ResourceUtils', () => ({
  canCreate: jest.fn(),
  canCreateResources: jest.fn(),
  generateMessage: jest.fn(),
  getEnvironmentResources: jest.fn(),
}));

describe('ResourceService', () => {
  const service = createResourceService(mockEndpoint);

  beforeEach(() => {
    mockEndpoint.mockResolvedValue({
      items: [
        {
          usage: 100,
          sys: { id: 'special_resource' },
        },
        {
          usage: 0,
          sys: { id: 'super_special_resource' },
        },
      ],
    });
    service.getAll.cache.clear();
  });

  describe('get', () => {
    it('should reject if not supplied with any arguments', async () => {
      await expect(() => service.get()).rejects.toThrow(
        'resourceType not supplied to ResourceService.get'
      );
    });

    it('should make a GET request with a path and the alpha header', async () => {
      await service.get('specialResource');

      expect(mockEndpoint).toHaveBeenNthCalledWith(
        1,
        {
          method: 'GET',
          path: ['resources'],
        },
        {
          'x-contentful-enable-alpha-feature': 'subscriptions-api',
        }
      );
    });

    it('returns a correct resource', async () => {
      const resource = await service.get('specialResource');
      expect(resource.usage).toBe(100);
    });

    it('should cached the response', async () => {
      await service.get('superSpecialResource');
      await service.get('specialResource');

      expect(mockEndpoint).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          path: ['resources'],
        }),
        expect.anything()
      );
    });

    it('should throw an error if the resource is not found in the response', async () => {
      mockEndpoint.mockResolvedValue({ items: [] });

      await expect(() => service.get('specialResource')).rejects.toThrow(
        'The resource specialResource could not be found.'
      );
    });
  });

  describe('getAll', () => {
    it('should make a GET request with a path and alpha header by default', async () => {
      await service.getAll();

      expect(mockEndpoint).toHaveBeenNthCalledWith(
        1,
        {
          method: 'GET',
          path: ['resources'],
        },
        {
          'x-contentful-enable-alpha-feature': 'subscriptions-api',
        }
      );
    });

    it('should cache the response', async () => {
      await service.getAll();
      await service.getAll();

      expect(mockEndpoint).toHaveBeenCalledTimes(1);
    });

    describe('canCreate', () => {
      it('should get the resource and then return the result of the canCreate utility', async () => {
        canCreate.mockReturnValue('something');

        const result = await service.canCreate('superSpecialResource');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources'],
          },
          expect.anything()
        );

        expect(canCreate).toHaveBeenCalledTimes(1);
        expect(result).toBe('something');
      });
    });

    describe('canCreateEnvironmentResources', () => {
      it('should get environment resources', async () => {
        await service.canCreateEnvironmentResources();

        expect(getEnvironmentResources).toBeCalledTimes(1);
      });

      it('should get all resources and then return the result of the canCreateResources utility', async () => {
        canCreateResources.mockReturnValue('something');

        const result = await service.canCreateEnvironmentResources();

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources'],
          },
          expect.anything()
        );

        expect(canCreateResources).toHaveBeenCalledTimes(1);
        expect(result).toBe('something');
      });
    });

    describe('messagesFor', () => {
      it('should get the resource and return the result of the generateMessage utility', async () => {
        generateMessage.mockReturnValue('a message');

        const result = await service.messagesFor('specialResource');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources'],
          },
          expect.anything()
        );
        expect(generateMessage).toHaveBeenCalledTimes(1);
        expect(result).toBe('a message');
      });
    });

    describe('messages', () => {
      it('should get all resources and return an object of mapped messages from the generateMessage utility', async () => {
        mockEndpoint.mockReset().mockResolvedValueOnce({
          items: [
            { sys: { id: 'resource_a' } },
            { sys: { id: 'resource_b' } },
            { sys: { id: 'resource_c' } },
          ],
        });

        generateMessage.mockReturnValue('a message');

        const result = await service.messages();

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources'],
          },
          expect.anything()
        );
        expect(generateMessage).toHaveBeenCalledTimes(3);
        expect(result).toEqual({
          resourceA: 'a message',
          resourceB: 'a message',
          resourceC: 'a message',
        });
      });
    });
  });
});
