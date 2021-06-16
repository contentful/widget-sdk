import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { PRESELECT_VALUES, SpacePurchaseRoute } from './SpacePurchaseRoute';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import createResourceService from 'services/ResourceService';
import {
  fetchPlatformPurchaseContent,
  fetchSpacePurchaseContent,
} from '../services/fetchSpacePurchaseContent';
import { EVENTS, trackEvent } from '../utils/analyticsTracking';
import { getOrganizationMembership, isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { transformSpaceRatePlans } from '../utils/transformSpaceRatePlans';
import * as TokenStore from 'services/TokenStore';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import { renderWithProvider } from '../__tests__/helpers';
import { getVariation } from 'LaunchDarkly';
import { mockOrganizationEndpoint } from '__mocks__/data/EndpointFactory';
import {
  getAddOnProductRatePlans,
  getAllProductRatePlans,
  getBasePlan,
  getSpacePlanForSpace,
  getSpacePlans,
  getSpaceProductRatePlans,
} from 'features/pricing-entities';
import { getPlansWithSpaces } from 'account/pricing/PricingDataProvider';
import { MemoryRouter, router } from 'core/react-routing';

const mockOrganization = FakeFactory.Organization();
const mockSpace = FakeFactory.Space();
const mockUserRole = 'admin';
const mockOrganizationPlatform = 'Free';
const mockFreeSpaceResource = { usage: 0, limits: { maximum: 1 } };
const mockSpaceRatePlans = ['plan1', 'plan2', 'plan3'];
const mockCurrentSpacePlan = { unavailabilityReasons: [{ type: 'currentPlan' }] };
const mockUpgradeSpaceRatePlans = [
  { ...mockCurrentSpacePlan, currentPlan: true },
  'plan2',
  'plan3',
];
const mockComposeAndLaunchProductRatePlan = FakeFactory.Plan();
const mockComposeAndLaunchPlan = {
  ...mockComposeAndLaunchProductRatePlan,
  productRatePlanId: mockComposeAndLaunchProductRatePlan.sys.id,
};

jest.mock('core/react-routing', () => ({
  ...jest.requireActual('core/react-routing'),
  router: {
    navigate: jest.fn(),
  },
}));

jest.mock('../utils/analyticsTracking', () => ({
  trackEvent: jest.fn(),
  EVENTS: jest.requireActual('../utils/analyticsTracking').EVENTS,
}));

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn(),
}));

jest.mock('../utils/transformSpaceRatePlans', () => ({
  transformSpaceRatePlans: jest.fn(),
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getSpace: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  getOrganizationMembership: jest.fn(),
  isOwner: jest.fn(),
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getPlansWithSpaces: jest.fn(),
  isSelfServicePlan: jest.requireActual('account/pricing/PricingDataProvider').isSelfServicePlan,
  isFreePlan: jest.requireActual('account/pricing/PricingDataProvider').isFreePlan,
}));

jest.mock('features/pricing-entities', () => ({
  getAddOnProductRatePlans: jest.fn(),
  getSpaceProductRatePlans: jest.fn(),
  getSpacePlans: jest.fn(),
  getBasePlan: jest.fn(),
  getSpacePlanForSpace: jest.fn(),
  getAllProductRatePlans: jest.fn(),
}));

jest.mock('../services/fetchSpacePurchaseContent', () => ({
  fetchSpacePurchaseContent: jest.fn(),
  fetchPlatformPurchaseContent: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const resourceService = {
    get: jest.fn(),
  };

  return () => resourceService;
});

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(),
}));

// Mock SpacePurchaseContainer in order to not have to mock the imports/on render effects it has
jest.mock('../components/SpacePurchaseContainer', () => ({
  SpacePurchaseContainer: jest
    .fn()
    .mockReturnValue(<div data-test-id="space-purchase-container" />),
}));

describe('SpacePurchaseRoute', () => {
  beforeEach(() => {
    createResourceService().get.mockResolvedValue(mockFreeSpaceResource);
    TokenStore.getOrganization.mockResolvedValue(mockOrganization);
    getTemplatesList.mockResolvedValue();
    getAllProductRatePlans.mockResolvedValue();
    getSpaceProductRatePlans.mockResolvedValue(mockSpaceRatePlans);
    getPlansWithSpaces.mockResolvedValue({ items: [] });
    fetchSpacePurchaseContent.mockResolvedValue();
    getOrganizationMembership.mockReturnValue({ role: mockUserRole });
    isOwner.mockReturnValue(true);
    getBasePlan.mockReturnValue({ customerType: mockOrganizationPlatform });
    transformSpaceRatePlans.mockReturnValue();
    getSpacePlans.mockReturnValue([]);
    getVariation.mockResolvedValue(false);
    getAddOnProductRatePlans.mockResolvedValue([mockComposeAndLaunchProductRatePlan]);
    getSpace.mockResolvedValue({ name: 'Space' });
  });

  it('should render the generic loading component until the apps purchase state is loaded', async () => {
    build({ navigationState: null }, false);

    expect(screen.getByTestId('cf-ui-empty-state')).toBeVisible();

    await waitFor(() => expect(getVariation).toBeCalled());

    expect(screen.queryByTestId('cf-ui-empty-state')).toBeNull();
  });

  it('should render the space plan selection page while loading, after the apps purchase state has been loaded', async () => {
    await build();

    expect(screen.getByTestId('space-purchase-container')).toBeVisible();
  });

  it('should redirect to space home if the user is not org admin or owner', async () => {
    isOwnerOrAdmin.mockReturnValueOnce(false);

    await build();

    await waitFor(() => {
      expect(router.navigate).toBeCalledWith({
        orgId: 'Organization2',
        path: 'organizations.subscription.overview',
      });
    });
  });

  it('should redirect to space home if the base plan is not self-service or free', async () => {
    getBasePlan.mockReturnValueOnce({ customerType: 'Enterprise' });

    await build();

    await waitFor(() => {
      expect(router.navigate).toBeCalledWith({
        orgId: mockOrganization.sys.id,
        path: 'organizations.subscription.overview',
      });
    });
  });

  it('should render the NewSpacePage and fire an event after loading', async () => {
    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: undefined,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'create_space',
        performancePackagePreselected: false,
        from: undefined,
      }
    );
  });

  it('should track if the user got to the flow through a CTA', async () => {
    await build({ search: '?from=other_place' });

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: undefined,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'create_space',
        performancePackagePreselected: false,
        from: 'other_place',
      }
    );
  });

  it('should preferentially use from if provided via UI router', async () => {
    await build({
      navigationState: { from: 'a_ui_router_place' },
      search: '?from=a_query_param_place',
    });

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: undefined,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'create_space',
        performancePackagePreselected: false,
        from: 'a_ui_router_place',
      }
    );
  });

  it('should track if the performance package is pre-selected using "preselect" param and the origin of the purchase by using "from" param', async () => {
    await build({ search: `?from=marketing_cta&preselect=${PRESELECT_VALUES.APPS}` });

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: undefined,
        sessionId: expect.any(String),
      },
      {
        canPurchaseApps: undefined,
        currentSpacePlan: undefined,
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'create_space',
        performancePackagePreselected: true,
        from: 'marketing_cta',
      }
    );
  });

  it('should track if user cannot purchase apps - feature flag is false', async () => {
    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: undefined,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'create_space',
        canPurchaseApps: undefined,
        performancePackagePreselected: false,
        from: undefined,
      }
    );
  });

  it('should track if user cannot purchase apps - already purchased apps', async () => {
    getVariation.mockResolvedValue(true);
    getPlansWithSpaces.mockResolvedValue({ items: [mockComposeAndLaunchPlan] });

    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: undefined,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'create_space',
        canPurchaseApps: false,
        performancePackagePreselected: false,
        from: undefined,
      }
    );
  });

  it('should track if user can purchase apps', async () => {
    getVariation.mockResolvedValue(true);

    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: undefined,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'create_space',
        canPurchaseApps: true,
        performancePackagePreselected: false,
        from: undefined,
      }
    );
  });

  it('should fetch and transform the space rate plans', async () => {
    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(getSpaceProductRatePlans).toBeCalled();
    expect(transformSpaceRatePlans).toBeCalledWith(mockSpaceRatePlans, mockFreeSpaceResource);
  });

  it('should fetch the subscriptionPlans', async () => {
    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(getSpacePlans).toBeCalledWith(mockOrganizationEndpoint);
  });

  it('should fetch the space plan selection FAQs by default', async () => {
    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(fetchSpacePurchaseContent).toBeCalled();
  });

  it('should fetch the platform selection FAQs by when user is purchasing campaigns', async () => {
    getVariation.mockResolvedValue(true);
    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(fetchPlatformPurchaseContent).toBeCalledWith();
  });

  describe('should render the SpacePlanSelectionStep', () => {
    it('the feature flag is false', async () => {
      await build();

      await waitFor(() => {
        expect(screen.getByTestId('space-purchase-container')).toBeVisible();
      });

      expect(fetchSpacePurchaseContent).toBeCalledWith();
    });

    it('the feature flag is true and user has purchased campaigns', async () => {
      getVariation.mockResolvedValue(true);
      getPlansWithSpaces.mockResolvedValue({ items: [mockComposeAndLaunchPlan] });

      await build();

      await waitFor(() => {
        expect(screen.getByTestId('space-purchase-container')).toBeVisible();
      });

      expect(fetchSpacePurchaseContent).toBeCalledWith();
    });
  });

  it('should render the platform purchase flow when feature flag is true', async () => {
    getVariation.mockResolvedValue(true);
    await build();

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(fetchPlatformPurchaseContent).toBeCalledWith();
  });

  it('should render the NewSpacePage and fire the upgrade_space event after loading when passed a spaceId', async () => {
    const mockSpaceRatePlan = {
      sys: {
        id: 'Plan',
      },
      ratePlanCharges: [],
      gatekeeperKey: 'abcd',
    };

    getSpacePlanForSpace.mockResolvedValue(mockSpaceRatePlan);
    transformSpaceRatePlans.mockReturnValue(mockUpgradeSpaceRatePlans);

    await build({ componentProps: { spaceId: mockSpace.sys.id } });

    await waitFor(() => {
      expect(screen.getByTestId('space-purchase-container')).toBeVisible();
    });

    expect(trackEvent).toBeCalledWith(
      EVENTS.BEGIN,
      {
        organizationId: mockOrganization.sys.id,
        spaceId: mockSpace.sys.id,
        sessionId: expect.any(String),
      },
      {
        canCreateFreeSpace: true,
        userOrganizationRole: mockUserRole,
        organizationPlatform: mockOrganizationPlatform,
        sessionType: 'upgrade_space',
        currentSpacePlan: mockSpaceRatePlan,
        performancePackagePreselected: false,
        from: undefined,
      }
    );
  });

  it('should show an error page if the fetch fails', async () => {
    TokenStore.getOrganization.mockRejectedValueOnce(new Error());

    await build();

    await waitFor(() => {
      expect(screen.getByTestId('cf-ui-error-state')).toBeVisible();
    });
  });
});

async function build({ componentProps, navigationState, search } = {}, shouldWait = true) {
  const props = {
    orgId: mockOrganization.sys.id,
  };

  renderWithProvider(
    () => (
      <MemoryRouter initialEntries={[{ state: navigationState || {}, search: search || '' }]}>
        <SpacePurchaseRoute orgId={mockOrganization.sys.id} {...(componentProps || {})} />
      </MemoryRouter>
    ),
    { sessionId: 'random_id' },
    props
  );

  if (shouldWait) {
    await waitFor(() => expect(screen.queryByTestId('cf-ui-empty-state')).toBeNull());
  }
}
