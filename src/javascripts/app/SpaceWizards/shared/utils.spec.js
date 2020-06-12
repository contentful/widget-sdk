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
import { createSpaceEndpoint, mockEndpoint } from 'data/EndpointFactory';
import { changeSpacePlan as changeSpacePlanApiCall } from 'account/pricing/PricingDataProvider';

import * as Fake from 'test/helpers/fakeFactory';
import {
  freeSpace,
  unavailableFreeSpace,
  mediumSpace,
  mediumSpaceCurrent,
} from '../__tests__/fixtures/plans';

const mockSpace = Fake.Space();
const mockOrganization = Fake.Organization({ isBillable: true });
const mockPlan = Fake.Plan();

jest.mock('utils/ResourceUtils', () => ({
  resourceHumanNameMap: {
    asset: 'Assets',
    content_type: 'Content Types',
    entry: 'Entries',
    locale: 'Locales',
    environment: 'Environments',
    record: 'Records',
    role: 'Roles',
  },
  canCreate: jest.fn(),
}));

jest.mock('services/client', () => {
  const client = {
    createSpace: jest.fn(),
  };

  return client;
});

jest.mock('account/pricing/PricingDataProvider', () => ({
  changeSpacePlan: jest.fn(),
}));

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

  describe('changeSpacePlan', () => {
    it('should attempt to change the space plan and track the correct events', async () => {
      await utils.changeSpacePlan({ space: mockSpace, plan: mockPlan });

      expect(changeSpacePlanApiCall).toBeCalledWith(expect.any(Function), mockPlan.sys.id);

      // We will do more strict assertions below, so we just test that the specific properties we want are here
      expect(Analytics.track).toBeCalledWith(
        'space_wizard:space_type_change',
        expect.objectContaining({
          intendedAction: 'change',
          spaceId: mockSpace.sys.id,
        })
      );
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

  describe('goToBillingPage', () => {
    it('should navigate the user to the organization settings billing page', () => {
      utils.goToBillingPage(mockOrganization);

      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'subscription_billing'],
        params: { orgId: mockOrganization.sys.id, pathSuffix: '/billing_address' },
        options: { reload: true },
      });
    });

    it('should track the link_click event', () => {
      utils.goToBillingPage(mockOrganization);

      expect(Analytics.track).toBeCalledWith(
        'space_wizard:link_click',
        expect.objectContaining({
          intendedAction: undefined,
        })
      );
    });

    it('should call onClose if provided', () => {
      const onClose = jest.fn();

      utils.goToBillingPage(mockOrganization, onClose);

      expect(onClose).toBeCalled();
    });
  });

  describe('transformSpaceRatePlans', () => {
    it('should return an empty array if given no space rate plans', () => {
      expect(utils.transformSpaceRatePlans({ organization: mockOrganization })).toEqual([]);
    });

    it('should mark the transformed plan with isFree is the productPlanType is free_space', () => {
      expect(
        utils.transformSpaceRatePlans({
          organization: mockOrganization,
          spaceRatePlans: [freeSpace],
          freeSpaceResource: Fake.SpaceResource(1, 5, 'free_space'),
        })
      ).toEqual([
        expect.objectContaining({
          isFree: true,
        }),
      ]);
    });

    it('should mark a plan as disabled if there are any unavailabilityReasons', () => {
      expect(
        utils.transformSpaceRatePlans({
          organization: mockOrganization,
          spaceRatePlans: [unavailableFreeSpace],
          freeSpaceResource: Fake.SpaceResource(1, 5, 'free_space'),
        })
      ).toEqual([
        expect.objectContaining({
          disabled: true,
        }),
      ]);
    });

    it('should mark a plan as disabled if the the plan is free and cannot create more free spaces', () => {
      expect(
        utils.transformSpaceRatePlans({
          organization: mockOrganization,
          spaceRatePlans: [freeSpace],
          freeSpaceResource: Fake.SpaceResource(2, 2, 'free_space'),
        })
      ).toEqual([
        expect.objectContaining({
          disabled: true,
        }),
      ]);
    });

    it('should mark a plan as disabled if the plan is not free and organization is not billable', () => {
      // By default, above, isBillable is true
      const organization = Fake.Organization({ isBillable: false });

      expect(
        utils.transformSpaceRatePlans({
          organization,
          spaceRatePlans: [mediumSpace],
          freeSpaceResource: Fake.SpaceResource(1, 5, 'free_space'),
        })
      ).toEqual([
        expect.objectContaining({
          disabled: true,
        }),
      ]);
    });

    it('should mark the plan as current if the plan has an unavailabilityReason with type as currentPlan', () => {
      expect(
        utils.transformSpaceRatePlans({
          organization: mockOrganization,
          spaceRatePlans: [mediumSpaceCurrent],
          freeSpaceResource: Fake.SpaceResource(1, 5, 'free_space'),
        })
      ).toEqual([
        expect.objectContaining({
          current: true,
        }),
      ]);
    });

    it('should return expected transformed plans', () => {
      const createProductRatePlanCharges = (
        envLimit = 1,
        rolesLimit = 2,
        localesLimit = 3,
        ctLimit = 4,
        recordsLimit = 5
      ) => {
        return [
          {
            name: 'Environments',
            tiers: [{ endingUnit: envLimit }],
          },
          {
            name: 'Roles',
            tiers: [{ endingUnit: rolesLimit }],
          },
          {
            name: 'Locales',
            tiers: [{ endingUnit: localesLimit }],
          },
          {
            name: 'Content types',
            tiers: [{ endingUnit: ctLimit }],
          },
          {
            name: 'Records',
            tiers: [{ endingUnit: recordsLimit }],
          },
        ];
      };

      const spaceRatePlans = [
        Fake.Plan({
          productPlanType: 'free_space',
          productRatePlanCharges: createProductRatePlanCharges(),
        }),
        Fake.Plan({
          productPlanType: 'space_type_1',
          productRatePlanCharges: createProductRatePlanCharges(10, 20, 30, 40, 50),
        }),
        Fake.Plan({
          productPlanType: 'space_type_2',
          productRatePlanCharges: createProductRatePlanCharges(5, 10, 15, 20, 25),
          unavailabilityReasons: [{ type: 'something' }],
        }),
        Fake.Plan({
          productPlanType: 'space_type_3',
          productRatePlanCharges: createProductRatePlanCharges(9, 8, 7, 6, 5),
        }),
        Fake.Plan({
          productPlanType: 'space_type_4',
          productRatePlanCharges: createProductRatePlanCharges(0, 0, 0, 0, 0),
          unavailabilityReasons: [{ type: 'currentPlan' }],
        }),
      ];

      expect(
        utils.transformSpaceRatePlans({
          organization: mockOrganization,
          spaceRatePlans,
          freeSpaceResource: Fake.SpaceResource(2, 2, 'free_space'),
        })
      ).toEqual([
        {
          isFree: true,
          disabled: true,
          current: false,
          includedResources: [
            {
              type: 'Environments',
              number: 2,
            },
            {
              type: 'Roles',
              number: 3,
            },
            {
              type: 'Locales',
              number: 3,
            },
            {
              type: 'Content types',
              number: 4,
            },
            {
              type: 'Records',
              number: 5,
            },
          ],
          ...spaceRatePlans[0],
        },
        {
          isFree: false,
          disabled: false,
          current: false,
          includedResources: [
            {
              type: 'Environments',
              number: 11,
            },
            {
              type: 'Roles',
              number: 21,
            },
            {
              type: 'Locales',
              number: 30,
            },
            {
              type: 'Content types',
              number: 40,
            },
            {
              type: 'Records',
              number: 50,
            },
          ],
          ...spaceRatePlans[1],
        },
        {
          isFree: false,
          disabled: true,
          current: false,
          includedResources: [
            {
              type: 'Environments',
              number: 6,
            },
            {
              type: 'Roles',
              number: 11,
            },
            {
              type: 'Locales',
              number: 15,
            },
            {
              type: 'Content types',
              number: 20,
            },
            {
              type: 'Records',
              number: 25,
            },
          ],
          ...spaceRatePlans[2],
        },
        {
          isFree: false,
          disabled: false,
          current: false,
          includedResources: [
            {
              type: 'Environments',
              number: 10,
            },
            {
              type: 'Roles',
              number: 9,
            },
            {
              type: 'Locales',
              number: 7,
            },
            {
              type: 'Content types',
              number: 6,
            },
            {
              type: 'Records',
              number: 5,
            },
          ],
          ...spaceRatePlans[3],
        },
        {
          isFree: false,
          disabled: true,
          current: true,
          includedResources: [
            {
              type: 'Environments',
              number: 1,
            },
            {
              type: 'Roles',
              number: 1,
            },
            {
              type: 'Locales',
              number: 0,
            },
            {
              type: 'Content types',
              number: 0,
            },
            {
              type: 'Records',
              number: 0,
            },
          ],
          ...spaceRatePlans[4],
        },
      ]);
    });
  });

  describe('getHighestPlan', () => {
    it('should return the plan with the highest price', () => {
      const plans = [
        Fake.Plan({ price: 1 }),
        Fake.Plan({ price: 5 }),
        Fake.Plan({ price: 20 }),
        Fake.Plan({ price: 2 }),
        Fake.Plan({ price: 7 }),
        Fake.Plan({ price: 8 }),
      ];

      expect(utils.getHighestPlan(plans)).toEqual(plans[2]);
    });

    it('should handle a plan with no price given', () => {
      const plans = [
        // There is no price by default in the fake plan
        Fake.Plan(),

        Fake.Plan({ price: 5 }),
        Fake.Plan({ price: 20 }),
        Fake.Plan({ price: 2 }),
        Fake.Plan({ price: 7 }),
        Fake.Plan({ price: 8 }),
      ];

      expect(utils.getHighestPlan(plans)).toEqual(plans[2]);
    });
  });

  describe('sendParnershipEmail', () => {
    it('should call the partner_projects endpoint with given spaceId and specific fields', () => {
      utils.sendParnershipEmail(mockSpace.sys.id, {
        clientName: 'Cyberdyne Systems',
        projectDescription: 'Skynet',
        estimatedDeliveryDate: '1997-08-04',
        anotherField: 'this-should-be-ignored',
      });

      expect(createSpaceEndpoint).toBeCalledWith(mockSpace.sys.id);
      expect(mockEndpoint).toBeCalledWith({
        method: 'POST',
        path: ['partner_projects'],
        data: {
          clientName: 'Cyberdyne Systems',
          projectDescription: 'Skynet',
          estimatedDeliveryDate: '1997-08-04',
        },
      });
    });

    it('should handle missing field data', () => {
      utils.sendParnershipEmail(mockSpace.sys.id);

      expect(mockEndpoint).toBeCalledWith({
        method: 'POST',
        path: ['partner_projects'],
        data: {
          clientName: '',
          projectDescription: '',
          estimatedDeliveryDate: '',
        },
      });
    });
  });

  describe('getPlanResourceFulfillment', () => {
    it('should return an object with `near` and `reached` statuses for a plan and resources', () => {
      const plan = utils.transformSpaceRatePlans({
        organization: mockOrganization,
        spaceRatePlans: [
          Fake.Plan({
            productPlanType: 'some_space_type',
            productRatePlanCharges: [
              {
                name: 'Records',
                tiers: [{ endingUnit: 10 }],
              },
              {
                name: 'Content types',
                tiers: [{ endingUnit: 10 }],
              },
              {
                name: 'Locales',
                tiers: [{ endingUnit: 10 }],
              },
            ],
          }),
        ],
        freeSpaceResource: Fake.OrganizationResource(1, 3, 'free_space'),
      })[0];

      const resources = [
        Fake.SpaceResource(1, 10, 'record'),
        Fake.SpaceResource(9, 10, 'content_type'),
        Fake.SpaceResource(10, 10, 'locale'),
      ];

      expect(utils.getPlanResourceFulfillment(plan, resources)).toEqual({
        Records: {
          near: false,
          reached: false,
        },
        'Content types': {
          near: true,
          reached: false,
        },
        Locales: {
          near: true,
          reached: true,
        },
      });
    });
  });

  describe('getRecommendedPlan', () => {
    const currentPlan = utils.transformSpaceRatePlans({
      organization: mockOrganization,
      spaceRatePlans: [
        Fake.Plan({
          productPlanType: 'some_space_type',
          productRatePlanCharges: [
            {
              name: 'Records',
              tiers: [{ endingUnit: 10 }],
            },
            {
              name: 'Content types',
              tiers: [{ endingUnit: 10 }],
            },
            {
              name: 'Locales',
              tiers: [{ endingUnit: 10 }],
            },
            {
              name: 'Environments',
              tiers: [{ endingUnit: 10 }],
            },
            {
              name: 'Roles',
              tiers: [{ endingUnit: 10 }],
            },
          ],
        }),
      ],
      freeSpaceResource: Fake.OrganizationResource(1, 3, 'free_space'),
    })[0];

    const nonrecommendablePlan = utils.transformSpaceRatePlans({
      organization: mockOrganization,
      spaceRatePlans: [
        Fake.Plan({
          productPlanType: 'some_space_type',
          productRatePlanCharges: [
            {
              name: 'Records',
              tiers: [{ endingUnit: 20 }],
            },
            {
              name: 'Content types',
              tiers: [{ endingUnit: 10 }],
            },
            {
              name: 'Locales',
              tiers: [{ endingUnit: 20 }],
            },
            {
              name: 'Environments',
              tiers: [{ endingUnit: 20 }],
            },
            {
              name: 'Roles',
              tiers: [{ endingUnit: 10 }],
            },
          ],
        }),
      ],
      freeSpaceResource: Fake.OrganizationResource(1, 3, 'free_space'),
    })[0];

    const recommendablePlan = utils.transformSpaceRatePlans({
      organization: mockOrganization,
      spaceRatePlans: [
        Fake.Plan({
          productPlanType: 'some_space_type',
          productRatePlanCharges: [
            {
              name: 'Records',
              tiers: [{ endingUnit: 20 }],
            },
            {
              name: 'Content types',
              tiers: [{ endingUnit: 20 }],
            },
            {
              name: 'Locales',
              tiers: [{ endingUnit: 20 }],
            },
            {
              name: 'Environments',
              tiers: [{ endingUnit: 20 }],
            },
            {
              name: 'Roles',
              tiers: [{ endingUnit: 20 }],
            },
          ],
        }),
      ],
      freeSpaceResource: Fake.OrganizationResource(1, 3, 'free_space'),
    })[0];

    it('should return null if nothing is near or has reached limit', () => {
      const resources = [
        Fake.SpaceResource(3, 10, 'record'),
        Fake.SpaceResource(5, 10, 'content_type'),
        Fake.SpaceResource(6, 10, 'locale'),
        Fake.SpaceResource(6, 10, 'environment'),
        Fake.SpaceResource(6, 10, 'role'),
      ];

      expect(
        utils.getRecommendedPlan(currentPlan, [nonrecommendablePlan, recommendablePlan], resources)
      ).toBeNull();
    });

    it('should return null if there is no larger plan that can fulfill the resource usage', () => {
      const resources = [
        Fake.SpaceResource(9, 10, 'record'),
        Fake.SpaceResource(10, 10, 'content_type'), // At limit
        Fake.SpaceResource(6, 10, 'locale'),
        Fake.SpaceResource(9, 10, 'environment'), // Near limit
        Fake.SpaceResource(6, 10, 'role'),
      ];

      expect(utils.getRecommendedPlan(currentPlan, [nonrecommendablePlan], resources)).toBeNull();
    });

    it('should return the recommended plan that fulfills all the resource usage', () => {
      const resources = [
        Fake.SpaceResource(9, 10, 'record'),
        Fake.SpaceResource(10, 10, 'content_type'), // At limit
        Fake.SpaceResource(6, 10, 'locale'),
        Fake.SpaceResource(9, 10, 'environment'), // Near limit
        Fake.SpaceResource(6, 10, 'role'),
      ];

      expect(
        utils.getRecommendedPlan(currentPlan, [nonrecommendablePlan, recommendablePlan], resources)
      ).toEqual(recommendablePlan);
    });
  });
});
