import createResourceService from './ResourceService';
import {
  createSpaceEndpoint,
  createOrganizationEndpoint,
  mockEndpoint
} from 'data/EndpointFactory';
import { canCreate, canCreateResources, generateMessage } from 'utils/ResourceUtils';

jest.mock('utils/ResourceUtils', () => ({
  canCreate: jest.fn(),
  canCreateResources: jest.fn(),
  generateMessage: jest.fn()
}));

describe('ResourceService', () => {
  afterEach(jest.clearAllMocks);

  describe('instantiation', () => {
    it('should by default use the space endpoint for instantiation', () => {
      createResourceService('space_1234');

      expect(createSpaceEndpoint).toHaveBeenCalledTimes(1);
    });

    it('should optionally allow instantiation using the "organization" type parameter value', () => {
      createResourceService('org_1234', 'organization');

      expect(createOrganizationEndpoint).toHaveBeenCalledTimes(1);
    });

    it('should optionally take and use the environment ID', () => {
      createResourceService('space_1234', 'space', 'env_1234');

      expect(createSpaceEndpoint).toHaveBeenCalledWith('space_1234', 'env_1234');
    });
  });

  describe('instantiated', () => {
    let service;

    beforeEach(() => {
      service = createResourceService('space_1234');
    });

    describe('get', () => {
      it('should reject if not supplied with any arguments', async () => {
        let err;

        try {
          await service.get();
        } catch (e) {
          err = e;
        }

        expect(err).toBeDefined();
      });

      it('should make a GET request with a path and the alpha header', async () => {
        await service.get('specialResource');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources', 'special_resource']
          },
          {
            'x-contentful-enable-alpha-feature': 'subscriptions-api'
          }
        );
      });

      it('should call the space scoped resource endpoint by default', async () => {
        await service.get('specialResource');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            path: ['resources', 'special_resource']
          }),
          expect.anything()
        );
      });

      it('should call the environment scoped endpoint if called with an environmentId', async () => {
        await service.get('specialResource', 'env_1234');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            path: ['environments', 'env_1234', 'resources', 'special_resource']
          }),
          expect.anything()
        );
      });
    });

    describe('getAll', () => {
      beforeEach(() => {
        mockEndpoint.mockReset().mockResolvedValueOnce({ items: [] });
      });

      it('should make a GET request with a path and alpha header by default', async () => {
        await service.getAll();

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources']
          },
          {
            'x-contentful-enable-alpha-feature': 'subscriptions-api'
          }
        );
      });

      it('should call the environment scoepd endpoint if called with an environmentId', async () => {
        await service.getAll('env_1234');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['environments', 'env_1234', 'resources']
          },
          {
            'x-contentful-enable-alpha-feature': 'subscriptions-api'
          }
        );
      });
    });

    describe('canCreate', () => {
      it('should get the resource and then return the result of the canCreate utility', async () => {
        canCreate.mockReturnValue('something');

        const result = await service.canCreate('superSpecialResource');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources', 'super_special_resource']
          },
          expect.anything()
        );

        expect(canCreate).toHaveBeenCalledTimes(1);
        expect(result).toBe('something');
      });
    });

    describe('canCreateEnvironmentResources', () => {
      it('should get all resources and then return the result of the canCreateResources utility', async () => {
        mockEndpoint.mockReset().mockResolvedValueOnce({ items: [] });

        canCreateResources.mockReturnValue('something');

        const result = await service.canCreateEnvironmentResources('env_1234');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['environments', 'env_1234', 'resources']
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

        const result = await service.messagesFor('aResource');

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources', 'a_resource']
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
            { sys: { id: 'resource_c' } }
          ]
        });

        generateMessage.mockReturnValue('a message');

        const result = await service.messages();

        expect(mockEndpoint).toHaveBeenNthCalledWith(
          1,
          {
            method: 'GET',
            path: ['resources']
          },
          expect.anything()
        );
        expect(generateMessage).toHaveBeenCalledTimes(3);
        expect(result).toEqual({
          resourceA: 'a message',
          resourceB: 'a message',
          resourceC: 'a message'
        });
      });
    });
  });
});
