import * as utils from './utils';
import client from 'services/client';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import { createApiKeyRepo } from 'features/api-keys-management';
import { go } from 'states/Navigator';
import { getCreator } from 'services/SpaceTemplateCreator';
import { getTemplate } from 'services/SpaceTemplateLoader';

import { $broadcast } from 'ng/$rootScope';
import * as spaceContext from 'ng/spaceContext';

import * as FakeFactory from 'test/helpers/fakeFactory';

const mockSpace = FakeFactory.Space();
const mockOrganization = FakeFactory.Organization();
const mockPlan = FakeFactory.Plan();

jest.mock('utils/ResourceUtils', () => ({
  resourceHumanNameMap: {
    asset: 'Assets',
    content_type: 'Content Types',
    entry: 'Entries',
    locale: 'Locales',
    environment: 'Environments',
    record: 'Records',
  },
  canCreate: jest.fn(),
}));

jest.mock('services/client', () => {
  const client = {
    createSpace: jest.fn(),
  };

  return client;
});

jest.mock('services/TokenStore', () => ({
  refresh: jest.fn(),
}));

jest.mock('features/api-keys-management', () => {
  const repo = {
    create: jest.fn(),
  };

  return {
    createApiKeyRepo: jest.fn().mockReturnValue(repo),
  };
});

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock(
  'ng/$rootScope',
  () => ({
    $broadcast: jest.fn(),
  }),
  { virtual: true }
);

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
    client.createSpace.mockResolvedValue(mockSpace);
  });

  describe('createSpace', () => {
    const call = async () => {
      return await utils.createSpace({
        name: 'My space',
        plan: mockPlan,
        organizationId: mockOrganization.sys.id,
      });
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

    it('should track the correct events', async () => {
      await call();

      // We will do more strict assertions below, so we just test that the specific properties we want are here
      expect(Analytics.track).toBeCalledWith(
        'space_wizard:space_create',
        expect.objectContaining({
          intendedAction: 'create',
          spaceId: mockSpace.sys.id,
        })
      );

      expect(Analytics.track).toBeCalledWith('space:create', {
        templateName: 'Blank',
      });
    });

    it('should create an example API key', async () => {
      const repo = createApiKeyRepo();

      await call();

      expect(repo.create).toBeCalledWith(
        'Example Key',
        'We’ve created an example API key for you to help you get started.'
      );
    });

    it('should navigate to the space and return the new space', async () => {
      const result = await call();

      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockSpace.sys.id },
      });

      expect(result).toEqual(mockSpace);
    });
  });

  describe('createSpaceWithTemplate', () => {
    const call = async (custom) => {
      const args = Object.assign(
        {
          name: 'My space',
          plan: mockPlan,
          organizationId: mockOrganization.sys.id,
          template: { name: 'My test template' },
          onTemplateCreationStarted: () => {},
        },
        custom
      );

      return await utils.createSpaceWithTemplate(args);
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

    it('should track the correct events', async () => {
      await call();

      expect(Analytics.track).toBeCalledWith(
        'space_wizard:space_create',
        expect.objectContaining({
          intendedAction: 'create',
          spaceId: mockSpace.sys.id,
        })
      );

      expect(Analytics.track).toBeCalledWith('space:create', {
        templateName: 'My test template',
        entityAutomationScope: { scope: 'space_template' },
      });
    });

    it('should çall the onTemplateCreationStarted callback', async () => {
      const onTemplateCreationStarted = jest.fn();

      await call({ onTemplateCreationStarted });

      expect(onTemplateCreationStarted).toBeCalled();
    });

    it('should broadcast an event on $rootScope, go to the new space, and return the new space', async () => {
      const result = await call();

      expect($broadcast).toBeCalledWith('spaceTemplateCreated');
      expect(go).toBeCalledWith({
        path: ['spaces', 'detail'],
        params: { spaceId: mockSpace.sys.id },
      });

      expect(result).toEqual(mockSpace);
    });

    describe('template creation', () => {
      it('should attempt to create a template with the templateCreator and fetched template data', async () => {
        const remoteTemplate = { name: 'Another template', sys: { id: 'template_5678' } };
        getTemplate.mockResolvedValue(remoteTemplate);

        const creator = getCreator();
        const template = { name: 'Hello world template' };

        await call({ template });

        expect(getCreator).toBeCalledWith(
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

        expect(err).not.toBeUndefined();

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

  describe('trackWizardEvent', () => {
    it('should track `space_wizard:eventName` with serialized given payload', () => {
      utils.trackWizardEvent('some_wizard_event', {
        spaceId: mockSpace.sys.id,
        currentStepId: 'current_step',
        targetStepId: 'next_step',
        action: 'awesome_action',
        paymentDetailsExist: true,
        currentPlan: {
          internalName: 'current_test_plan',
          productType: 'test_product_type',
        },
        selectedPlan: {
          internalName: 'selected_test_plan',
          productType: 'test_product_type_2',
        },
        recommendedPlan: {
          internalName: 'recommended_test_plan',
          productType: 'test_product_type_3',
        },
        newSpaceName: 'A new space',
        newSpaceTemplate: {
          name: 'Test template',
        },
      });

      expect(Analytics.track).toBeCalledWith('space_wizard:some_wizard_event', {
        spaceId: mockSpace.sys.id,
        currentStep: 'current_step',
        targetStep: 'next_step',
        intendedAction: 'awesome_action',
        paymentDetailsExist: true,
        targetSpaceType: 'selected_test_plan',
        targetProductType: 'test_product_type_2',
        targetSpaceName: 'A new space',
        targetSpaceTemplateId: 'Test template',
        currentSpaceType: 'current_test_plan',
        currentProductType: 'test_product_type',
        recommendedSpaceType: 'recommended_test_plan',
        recommendedProductType: 'test_product_type_3',
      });
    });

    it('should give all optional keys null values if not given in payload', () => {
      utils.trackWizardEvent('another_wizard_event', {
        spaceId: mockSpace.sys.id,
        action: 'an_action',
      });

      expect(Analytics.track).toBeCalledWith('space_wizard:another_wizard_event', {
        spaceId: mockSpace.sys.id,
        currentStep: null,
        targetStep: null,
        intendedAction: 'an_action',
        paymentDetailsExist: null,
        targetSpaceType: null,
        targetProductType: null,
        targetSpaceName: null,
        targetSpaceTemplateId: null,
        currentSpaceType: null,
        currentProductType: null,
        recommendedSpaceType: null,
        recommendedProductType: null,
      });
    });

    it('should not include the spaceId if not given in the payload', () => {
      utils.trackWizardEvent('third_wizard_event', {
        action: 'third_action',
      });

      expect(Analytics.track).toBeCalledWith('space_wizard:third_wizard_event', {
        currentStep: null,
        targetStep: null,
        intendedAction: 'third_action',
        paymentDetailsExist: null,
        targetSpaceType: null,
        targetProductType: null,
        targetSpaceName: null,
        targetSpaceTemplateId: null,
        currentSpaceType: null,
        currentProductType: null,
        recommendedSpaceType: null,
        recommendedProductType: null,
      });
    });
  });

  describe('getIncludedResources', () => {
    const createCharge = (name, amount) => ({
      name,
      tiers: [
        {
          endingUnit: amount,
        },
      ],
    });
    it('should map over roles, envs, content types, records, and locales and determine how much of each the charges have', () => {
      const charges = [
        /*
        See above `createCharge` function.

        The charges have the following shape:

        {
          name: 'Environments',
          tiers: [
            {
              endingUnit: 10
            }
          ]
        }
       */
        createCharge('Environments', 10),
        createCharge('Roles', 15),
        createCharge('Locales', 20),
        createCharge('Some unknown charge', 40),
        createCharge('Content types', 25),
        createCharge('Records', 50000),
      ];

      expect(utils.getIncludedResources(charges)).toEqual([
        // Environments and Roles have 1 added to them
        { type: 'Environments', number: 11 },
        { type: 'Roles', number: 16 },
        { type: 'Locales', number: 20 },
        { type: 'Content types', number: 25 },
        { type: 'Records', number: 50000 },
      ]);
    });
  });

  describe('getTooltip', () => {
    it('should return undefined if neither Environments nor Records is given as type', () => {
      expect(utils.getTooltip('unknown')).toBeUndefined();
    });

    it('should return text if given Records as type', () => {
      expect(utils.getTooltip('Records')).toEqual('Records are entries and assets combined.');
    });

    it('should return text if given Environments and a number as type and amount', () => {
      expect(utils.getTooltip('Environments', 5)).toEqual(
        'This space type includes 1 master and 4 sandbox environments.'
      );
    });
  });

  describe('getRolesTooltip', () => {
    it('should return text for a plan with the admin role only', () => {
      const tooltip = utils.getRolesTooltip(1, { roles: [] });
      expect(tooltip).toBe(`This space type includes the Admin role only`);
    });

    it('should return text for a plan with various roles', () => {
      const tooltip = utils.getRolesTooltip(3, { roles: ['Editor', 'Translator'] });
      expect(tooltip).toBe(`This space type includes the Admin, Editor, and Translator roles`);
    });

    it('should return text for a plan with multiple translator roles', () => {
      const tooltip = utils.getRolesTooltip(5, {
        roles: ['Editor', 'Translator', 'Translator 2', 'Translator3'],
      });
      expect(tooltip).toBe(`This space type includes the Admin, Editor, and 3 Translator roles`);
    });

    it('should return text for a plan with custom roles', () => {
      const tooltip = utils.getRolesTooltip(10, { roles: ['Editor', 'Translator'] });
      expect(tooltip).toBe(
        `This space type includes the Admin, Editor, and Translator roles and an additional 7 custom roles`
      );
    });
  });
});
