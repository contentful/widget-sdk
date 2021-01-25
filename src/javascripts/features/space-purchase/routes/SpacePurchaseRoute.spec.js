import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { SpacePurchaseRoute } from './SpacePurchaseRoute';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { getProductPlans } from 'account/pricing/PricingDataProvider';
import createResourceService from 'services/ResourceService';
import {
  fetchSpacePurchaseContent,
  fetchPlatformPurchaseContent,
} from '../services/fetchSpacePurchaseContent';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { getOrganizationMembership, isOwnerOrAdmin, isOwner } from 'services/OrganizationRoles';
import { transformSpaceRatePlans } from '../utils/transformSpaceRatePlans';
import { go } from 'states/Navigator';
import * as TokenStore from 'services/TokenStore';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { getSpaces } from 'access_control/OrganizationMembershipRepository';
import { renderWithProvider } from '../__tests__/helpers';
import { getVariation } from 'LaunchDarkly';
import { mockEndpoint } from '__mocks__/data/EndpointFactory';
import {
  getAddOnProductRatePlans,
  getSpaceProductRatePlans,
  getSpacePlans,
  getSpacePlanForSpace,
  getBasePlan,
} from 'features/pricing-entities';

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
const mockComposeProductRatePlan = FakeFactory.Plan();

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
  getSpaces: jest.fn(),
}));

jest.mock('services/OrganizationRoles', () => ({
  getOrganizationMembership: jest.fn(),
  isOwner: jest.fn(),
  isOwnerOrAdmin: jest.fn().mockReturnValue(true),
}));

jest.mock('account/pricing/PricingDataProvider', () => ({
  getProductPlans: jest.fn(),
  getSpaceRatePlans: jest.fn(),
  isSelfServicePlan: jest.requireActual('account/pricing/PricingDataProvider').isSelfServicePlan,
  isFreePlan: jest.requireActual('account/pricing/PricingDataProvider').isFreePlan,
}));

jest.mock('features/pricing-entities', () => ({
  getAddOnProductRatePlans: jest.fn(),
  getSpaceRatePlans: jest.fn(),
  getBaseRatePlan: jest.fn(),
  getSpaceRatePlanForSpace: jest.fn(),
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
  getSpace: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
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
    getProductPlans.mockResolvedValue();
    getSpaceProductRatePlans.mockResolvedValue(mockSpaceRatePlans);
    fetchSpacePurchaseContent.mockResolvedValue();
    getOrganizationMembership.mockReturnValue({ role: mockUserRole });
    isOwner.mockReturnValue(true);
    getBasePlan.mockReturnValue({ customerType: mockOrganizationPlatform });
    transformSpaceRatePlans.mockReturnValue();
    getSpacePlans.mockReturnValue({ items: [] });
    getVariation.mockResolvedValue(false);
    getSpaces.mockResolvedValue({
      total: 1,
      items: [],
    });
    getAddOnProductRatePlans.mockResolvedValue({
      total: 1,
      items: [mockComposeProductRatePlan],
    });
  });

  it('should render the generic loading component until the apps purchase state is loaded', async () => {
    build(null, false);

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
      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'subscription_new'],
        params: { orgId: mockOrganization.sys.id },
      });
    });
  });

  it('should redirect to space home if the base plan is not self-service or free', async () => {
    getBasePlan.mockReturnValueOnce({ customerType: 'Enterprise' });

    await build();

    await waitFor(() => {
      expect(go).toBeCalledWith({
        path: ['account', 'organizations', 'subscription_new'],
        params: { orgId: mockOrganization.sys.id },
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
        canPurchaseApps: false,
        performancePackagePreselected: false,
        from: '',
      }
    );
  });
  it('should track if the user got to the flow through a CTA', async () => {
    const otherPlaceInApp = 'other_place';
    await build({ from: otherPlaceInApp });

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
        from: otherPlaceInApp,
      }
    );
  });

  it('should track if the performance package is pre-selected', async () => {
    await build({ viaMarketingCTA: true });

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
        performancePackagePreselected: true,
        from: '',
      }
    );
  });

  it('should track if user cannot purchase apps', async () => {
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
        from: '',
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

    expect(getSpacePlans).toBeCalledWith(mockEndpoint);
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

  it('should render the NewSpacePage and fire the upgrade_space event after loading when passed a spaceId', async () => {
    const mockSpaceRatePlan = {
      sys: {
        id: 'Plan',
      },
      ratePlanCharges: [],
      gatekeeperKey: 'abcd',
    };

    getSpacePlanForSpace.mockResolvedValue(mockSpaceRatePlan);
    TokenStore.getSpace.mockReturnValueOnce(mockSpace);
    transformSpaceRatePlans.mockReturnValue(mockUpgradeSpaceRatePlans);

    await build({ spaceId: mockSpace.sys.id });

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
        canPurchaseApps: false,
        performancePackagePreselected: false,
        from: '',
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

async function build(customProps, shouldWait = true) {
  const props = {
    orgId: mockOrganization.sys.id,
    viaMarketingCTA: false,
    from: '',
    ...customProps,
  };

  renderWithProvider(SpacePurchaseRoute, { sessionId: 'random_id' }, props);

  if (shouldWait) {
    await waitFor(() => expect(screen.queryByTestId('cf-ui-empty-state')).toBeNull());
  }
}
