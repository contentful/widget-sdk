import * as utils from './spaceCreation';
import * as TokenStore from 'services/TokenStore';
import { getCreator } from 'services/SpaceTemplateCreator';
import { getTemplate } from 'services/SpaceTemplateLoader';

import * as spaceContext from 'ng/spaceContext';

import * as Fake from 'test/helpers/fakeFactory';

const mockSpace = Fake.Space();
const mockOrganization = Fake.Organization({ isBillable: true });
const mockPlan = Fake.Plan();

const mockCreateSpace = jest.fn();

jest.mock('core/services/usePlainCMAClient', () => ({
  getCMAClient: () => ({
    space: {
      create: mockCreateSpace,
    },
  }),
}));

jest.mock('services/TokenStore', () => ({
  refresh: jest.fn(),
  getSpace: jest.fn(),
}));

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
    mockCreateSpace.mockReset();
    TokenStore.getSpace.mockResolvedValue(mockSpace);
    mockCreateSpace.mockResolvedValue(mockSpace);

    const resetWithSpace = jest.fn();
    spaceContext.resetWithSpace = resetWithSpace;
  });

  describe('makeNewSpace', () => {
    const call = async () => {
      return await utils.makeNewSpace(mockOrganization.sys.id, mockPlan.sys.id, 'My space');
    };

    it('should attempt to create the space using the client and refresh the token', async () => {
      await call();

      expect(mockCreateSpace).toBeCalledWith(
        {
          organizationId: mockOrganization.sys.id,
        },
        {
          defaultLocale: 'en-US',
          name: 'My space',
          productRatePlanId: mockPlan.sys.id,
        }
      );
      expect(TokenStore.refresh).toBeCalled();
    });

    it('should return the new space', async () => {
      const result = await call();

      expect(result).toEqual(mockSpace);
    });
  });

  describe('applyTemplateToSpace', () => {
    const mockTemplate = { name: 'Template' };
    const call = async () => {
      return await utils.applyTemplateToSpace(mockSpace, mockTemplate);
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
  });
});
