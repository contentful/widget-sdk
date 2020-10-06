import * as utils from './spaceCreation';
import client from 'services/client';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import { createApiKeyRepo } from 'features/api-keys-management';
import { getCreator } from 'services/SpaceTemplateCreator';
import { getTemplate } from 'services/SpaceTemplateLoader';

import { $broadcast } from 'ng/$rootScope';
import * as spaceContext from 'ng/spaceContext';

import * as Fake from 'test/helpers/fakeFactory';

const mockSpace = Fake.Space();
const mockOrganization = Fake.Organization({ isBillable: true });
const mockPlan = Fake.Plan();

jest.mock('services/client', () => {
  const client = {
    createSpace: jest.fn(),
  };

  return client;
});

jest.mock('services/TokenStore', () => ({
  refresh: jest.fn(),
  getSpace: jest.fn(),
}));

jest.mock('features/api-keys-management', () => {
  const repo = {
    create: jest.fn(),
  };

  return {
    createApiKeyRepo: jest.fn().mockReturnValue(repo),
  };
});

jest.mock('services/SpaceTemplateCreator', () => {
  const createApi = {
    spaceSetup: Promise.resolve(),
    contentCreated: Promise.resolve(),
  };

  const creator = {
    create: jest.fn().mockReturnValue(createApi),
  };

  return {
    getCreator: jest.fn().mockReturnValue(creator),
  };
});

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplate: jest.fn(),
}));

describe('utils', () => {
  beforeEach(() => {
    TokenStore.getSpace.mockResolvedValue(mockSpace);
    client.createSpace.mockResolvedValue(mockSpace);

    const resetWithSpace = jest.fn();
    spaceContext.resetWithSpace = resetWithSpace;
  });

  describe('createSpace', () => {
    const call = async () => {
      return await utils.createSpace(mockOrganization.sys.id, mockPlan, 'My space');
    };

    it('should attempt to create the space using the client and refresh the token', async () => {
      await call();

      expect(client.createSpace).toBeCalledWith(
        {
          defaultLocale: 'en-US',
          name: 'My space',
          productRatePlanId: mockPlan.sys.id,
        },
        mockOrganization.sys.id
      );
      expect(TokenStore.refresh).toBeCalled();
    });

    it('should create an example API key', async () => {
      const repo = createApiKeyRepo();

      await call();

      expect(repo.create).toBeCalledWith(
        'Example Key',
        'We’ve created an example API key for you to help you get started.'
      );
    });

    it('should return the new space', async () => {
      const result = await call();

      expect(result).toEqual(mockSpace);
    });
  });

  describe('createSpaceWithTemplate', () => {
    const call = async (template) => {
      return await utils.createSpaceWithTemplate(
        mockOrganization.sys.id,
        mockPlan,
        'My space',
        template ?? { name: 'My test template' }
      );
    };

    it('should attempt to create the space using the client and refresh the token', async () => {
      await call();

      expect(client.createSpace).toBeCalledWith(
        {
          defaultLocale: 'en-US',
          name: 'My space',
          productRatePlanId: mockPlan.sys.id,
        },
        mockOrganization.sys.id
      );
      expect(TokenStore.refresh).toBeCalled();
    });

    it('should get the new space from the token store than reset the spaceContext with it', async () => {
      await call();

      expect(TokenStore.getSpace).toBeCalledWith(mockSpace.sys.id);
      expect(spaceContext.resetWithSpace).toBeCalledWith(mockSpace);
    });

    it('should track the correct events', async () => {
      await call();

      expect(Analytics.track).toBeCalledWith('space:create', {
        templateName: 'My test template',
        entityAutomationScope: { scope: 'space_template' },
      });
    });

    it('should broadcast an event on $rootScope, go to the new space, and return the new space', async () => {
      const result = await call();

      expect($broadcast).toBeCalledWith('spaceTemplateCreated');

      expect(result).toEqual(mockSpace);
    });

    describe('template creation', () => {
      it('should attempt to create a template with the templateCreator and fetched template data', async () => {
        const remoteTemplate = { name: 'Another template', sys: { id: 'template_5678' } };
        getTemplate.mockResolvedValue(remoteTemplate);

        const creator = getCreator();
        const template = { name: 'Hello world template' };

        await call(template);

        expect(getCreator).toBeCalledWith(
          spaceContext,
          { onItemSuccess: expect.any(Function), onItemError: expect.any(Function) },
          template,
          'en-US'
        );
        expect(getTemplate).toBeCalledWith(template);
        expect(creator.create).toBeCalledWith(remoteTemplate);
      });

      it('should ignore spaceSetup errors from the templateCreator', async () => {
        getCreator().create.mockReturnValue({
          spaceSetup: Promise.reject(),
          contentCreated: Promise.resolve(),
        });

        await call();
      });

      it('should retry once if the content was not successfully created', async () => {
        const { create } = getCreator();

        create.mockReturnValueOnce({
          spaceSetup: Promise.resolve(),
          contentCreated: Promise.reject({ template: null }),
        });

        await call();

        expect(create).toHaveBeenCalledTimes(2);
      });

      it('should only retry once and then throw', async () => {
        const { create } = getCreator();

        create.mockReturnValue({
          spaceSetup: Promise.resolve(),
          contentCreated: Promise.reject({ template: null }),
        });

        let err;

        try {
          await call();
        } catch (e) {
          err = e;
        }

        expect(err).toBeDefined();

        // Reset mock
        create.mockReturnValue({
          spaceSetup: Promise.resolve(),
          contentCreated: Promise.resolve(),
        });
      });

      it('should refresh the space content types', async () => {
        await call();

        expect(spaceContext.publishedCTs.refresh).toBeCalled();
      });
    });
  });

  describe('createTemplate', () => {
    const mockTemplate = { name: 'Template' };
    const call = async () => {
      return await utils.createTemplate(mockSpace, mockTemplate);
    };

    it('should attempt to create the template for the designated space', async () => {
      const remoteTemplate = { name: 'Another template', sys: { id: 'template_5678' } };
      getTemplate.mockResolvedValue(remoteTemplate);
      await call();

      expect(TokenStore.getSpace).toBeCalledWith(mockSpace.sys.id);
      expect(getCreator).toBeCalledWith(
        spaceContext,
        { onItemSuccess: expect.any(Function), onItemError: expect.any(Function) },
        mockTemplate,
        'en-US'
      );
      expect(getTemplate).toBeCalledWith(mockTemplate);
      expect(getCreator().create).toBeCalledWith(remoteTemplate);
    });
  });
});
