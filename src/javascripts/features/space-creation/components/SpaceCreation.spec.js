import React from 'react';
import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import { SpaceCreation } from './SpaceCreation';
import { SpaceCreationState } from '../context/SpaceCreationContext';
import * as Fake from 'test/helpers/fakeFactory';
import createResourceService from 'services/ResourceService';
import { getProductPlans } from 'account/pricing/PricingDataProvider';
import { getSpaceRatePlans } from 'features/pricing-entities';
import { Notification } from '@contentful/forma-36-react-components';
import userEvent from '@testing-library/user-event';

const mockCreateSpace = jest.fn();

jest.mock('core/services/usePlainCMAClient', () => ({
  getCMAClient: () => ({
    space: {
      create: mockCreateSpace,
    },
  }),
}));

const mockOrg = Fake.Organization({ name: 'Test Org' });

const mockMediumRatePlanCharges = [
  Fake.RatePlanCharge('Environments', 4),
  Fake.RatePlanCharge('Roles', 3),
  Fake.RatePlanCharge('Locales', 7),
  Fake.RatePlanCharge('Content types', 48),
  Fake.RatePlanCharge('Records', 25000),
];
const mockMediumPlan = Fake.Plan({
  name: 'Medium',
  ratePlanCharges: mockMediumRatePlanCharges,
  roleSet: { roles: [] },
});

const mockLargeRatePlanCharges = [
  Fake.RatePlanCharge('Environments', 6),
  Fake.RatePlanCharge('Roles', 5),
  Fake.RatePlanCharge('Locales', 10),
  Fake.RatePlanCharge('Content types', 48),
  Fake.RatePlanCharge('Records', 50000),
];
const mockLargePlan1 = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockLargeRatePlanCharges,
  roleSet: { roles: [] },
});
const mockLargePlan2 = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockLargeRatePlanCharges,
  roleSet: { roles: [] },
});

const mockPerfRatePlanCharges = [
  Fake.RatePlanCharge('Environments', 11),
  Fake.RatePlanCharge('Roles', 8),
  Fake.RatePlanCharge('Locales', 30),
  Fake.RatePlanCharge('Content types', 96),
  Fake.RatePlanCharge('Records', 100000),
];
const mockPerformance1xPlan = Fake.Plan({
  name: 'Performance 1x',
  ratePlanCharges: mockPerfRatePlanCharges,
  roleSet: { roles: [] },
});

const mockPlans = [mockMediumPlan, mockLargePlan1, mockLargePlan2, mockPerformance1xPlan];

const mockFreePlan = Fake.Plan({
  name: 'Trial Space',
  productPlanType: 'free_space',
  productRatePlanCharges: mockPerfRatePlanCharges,
  roleSet: { roles: [] },
});

const mockRatePlans = [
  Fake.Plan({
    name: 'Medium',
    productRatePlanCharges: mockMediumRatePlanCharges,
    roleSet: { roles: [] },
  }),
  Fake.Plan({
    name: 'Large',
    productRatePlanCharges: mockLargeRatePlanCharges,
    roleSet: { roles: [] },
  }),
  Fake.Plan({
    name: 'Performance 1x',
    productRatePlanCharges: mockPerfRatePlanCharges,
    roleSet: { roles: [] },
  }),
  Fake.Plan({
    name: 'Performance 2x',
    productRatePlanCharges: mockPerfRatePlanCharges,
    roleSet: { roles: [] },
  }),
  mockFreePlan,
];

const mockFreeSpaceResources = {
  name: 'Free space',
  usage: 2,
  limits: { included: 10, maximum: 10 },
  sys: { type: 'OrganizationResource', id: 'free_space' },
};

const mockTemplate = {
  name: 'My template',
  sys: {
    id: 'template_1234',
  },
};

jest.mock('account/pricing/PricingDataProvider', () => ({
  getProductPlans: jest.fn(),
  isFreeProductPlan: jest.fn((plan) => plan.name === mockFreePlan.name),
}));

jest.mock('features/pricing-entities', () => ({
  getSpaceRatePlans: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const resourceService = {
    get: jest.fn(),
  };
  return () => resourceService;
});

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('features/space-plan-assignment/services/SpacePlanAssignmentService', () => ({
  changeSpacePlanAssignment: jest.fn(),
}));

const initialState = {
  organization: mockOrg,
  spaceName: '',
  templatesList: [mockTemplate],
  selectedTemplate: null,
  selectedPlan: undefined,
};

describe('SpaceCreation', () => {
  const build = (state = initialState, props) => {
    return render(
      <SpaceCreationState.Provider value={{ state, dispatch: () => {} }}>
        <SpaceCreation orgId={mockOrg.sys.id} {...props} />
      </SpaceCreationState.Provider>
    );
  };

  beforeEach(() => {
    getSpaceRatePlans.mockResolvedValue({ total: mockPlans.length, items: mockPlans });
    getProductPlans.mockResolvedValue(mockRatePlans);
    createResourceService().get.mockResolvedValue(mockFreeSpaceResources);
    mockCreateSpace.mockReset();
  });

  afterEach(Notification.closeAll);
  describe('Space Selection', () => {
    it('should render list of available plans grouped by type', async () => {
      build();
      await waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));
      expect(screen.getByText('Choose a space type for your new space')).toBeVisible();
      expect(screen.getAllByTestId('space-plan-item')).toHaveLength(4);
      expect(screen.getByText('Get in touch if you need something more')).toBeVisible();
      expect(screen.getByTestId('go-back-btn')).toBeVisible();
      expect(screen.getByTestId('continue-btn')).toBeVisible();
      expect(screen.getByTestId('continue-btn')).toBeDisabled();
    });

    it('should render list of available plans with entitlements information and correct limits', async () => {
      build();
      await waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));
      expect(screen.getAllByTestId('space-plan-item')).toHaveLength(4);
      expect(screen.getAllByTestId('space-plan-entitlements')).toHaveLength(4);
      const mediumPlanItem = screen.getAllByTestId('space-plan-item')[0];
      expect(within(mediumPlanItem).getByTestId('cf-ui-tag').innerHTML).toEqual('1 available');
      const largePlanItem = screen.getAllByTestId('space-plan-item')[1];
      expect(within(largePlanItem).getByTestId('cf-ui-tag').innerHTML).toEqual('2 available');
    });

    it('should render with disabled Trial Space if free space limit is reached', async () => {
      const mockFreeSpaceResources = {
        name: 'Free space',
        usage: 10,
        limits: { included: 10, maximum: 10 },
        sys: { type: 'OrganizationResource', id: 'free_space' },
      };
      createResourceService().get.mockResolvedValue(mockFreeSpaceResources);
      build();
      await waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));
      expect(screen.getAllByTestId('space-plan-item')).toHaveLength(4);
      expect(screen.getByLabelText(mockFreePlan.name)).toBeDisabled();
    });
  });

  describe('SpaceDetailsSetup', () => {
    it('should render with name field and templates toggle', async () => {
      build({ ...initialState, selectedPlan: mockMediumPlan });
      expect(screen.getByText('Set up your new Medium space')).toBeVisible();
      expect(screen.getByTestId('space-name')).toBeVisible();
      expect(screen.getByText('Empty space')).toBeVisible();
      expect(screen.getByText('Example space')).toBeVisible();
      expect(screen.getByTestId('go-back-btn')).toBeVisible();
      expect(screen.getByTestId('continue-btn')).toBeVisible();
      expect(screen.getByTestId('continue-btn')).toBeDisabled();
    });

    it('should show available templates if Example space option chosen', async () => {
      build({ ...initialState, selectedPlan: mockMediumPlan });
      userEvent.click(screen.getByText('Example space'));
      expect(screen.getByTestId('template-list-wrapper')).toBeVisible();
      expect(screen.getByText(mockTemplate.name)).toBeVisible();
    });
  });

  describe('SpaceCreationConfirm', () => {
    it('should render with correct name and space plan', async () => {
      build({ ...initialState, selectedPlan: mockMediumPlan, spaceName: 'Test' });
      expect(screen.getByText('Set up your new Medium space')).toBeVisible();
      userEvent.click(screen.getByTestId('continue-btn'));
      expect(screen.getByTestId('cf-ui-subheading')).toBeVisible();
      expect(screen.getByText('Test (Medium)')).toBeVisible();
      expect(screen.getByTestId('go-back-btn')).toBeVisible();
      expect(screen.getByText('Confirm and create')).toBeVisible();
    });

    it('should call createSpace function with correct spacePlanId for Medium plan', async () => {
      build({ ...initialState, selectedPlan: mockMediumPlan, spaceName: 'Test' });
      userEvent.click(screen.getByTestId('continue-btn'));
      userEvent.click(screen.getByText('Confirm and create'));

      expect(mockCreateSpace).toBeCalledWith(
        {
          organizationId: mockOrg.sys.id,
        },
        {
          defaultLocale: 'en-US',
          name: 'Test',
          spacePlanId: mockMediumPlan.sys.id,
        }
      );
    });

    it('should call createSpace function with correct payload for Trial Space', async () => {
      build({ ...initialState, selectedPlan: mockFreePlan, spaceName: 'Test' });
      userEvent.click(screen.getByTestId('continue-btn'));
      userEvent.click(screen.getByText('Confirm and create'));

      expect(mockCreateSpace).toBeCalledWith(
        {
          organizationId: mockOrg.sys.id,
        },
        {
          defaultLocale: 'en-US',
          name: 'Test',
          productRatePlanId: 'free',
        }
      );
    });
  });
});
