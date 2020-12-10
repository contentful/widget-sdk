import React from 'react';
import { render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { SpacePlanAssignment } from './SpacePlanAssignment';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';
import createResourceService from 'services/ResourceService';
import { getRatePlans, getSubscriptionPlans } from 'account/pricing/PricingDataProvider';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import userEvent from '@testing-library/user-event';
import { track } from 'analytics/Analytics';
import { Notification } from '@contentful/forma-36-react-components';
import { changeSpacePlanAssignment } from '../services/SpacePlanAssignmentService';

const mockSpace = Fake.Space({ name: 'Test Space' });

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
});
const mockLargePlan2 = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockLargeRatePlanCharges,
});
const mockLargePlanCustom = Fake.Plan({
  name: 'Large',
  ratePlanCharges: [
    Fake.RatePlanCharge('Environments', 6),
    Fake.RatePlanCharge('Roles', 5),
    Fake.RatePlanCharge('Locales', 10),
    Fake.RatePlanCharge('Content types', 48000),
    Fake.RatePlanCharge('Records', 50000),
  ],
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

//currentPlan
const mockPerformance2xPlan = Fake.Plan({
  name: 'Performance 2x',
  ratePlanCharges: mockPerfRatePlanCharges,
  gatekeeperKey: mockSpace.sys.id,
  roleSet: { roles: [] },
});

const mockPlans = [
  mockMediumPlan,
  mockLargePlan1,
  mockLargePlan2,
  mockLargePlanCustom,
  mockPerformance1xPlan,
  mockPerformance2xPlan,
];

const mockFreePlan = Fake.Plan({
  name: 'Proof of concept',
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

const mockSpaceResources = [
  Fake.SpaceResource(6, 11, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  Fake.SpaceResource(2, 8, 'role'),
  Fake.SpaceResource(9, 30, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
  Fake.SpaceResource(25, 96, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  Fake.SpaceResource(2000, 100000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
];

jest.mock('account/pricing/PricingDataProvider', () => ({
  getRatePlans: jest.fn(),
  getSubscriptionPlans: jest.fn(),
  isFreeProductPlan: jest.fn(),
}));

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getSpace: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const resourceService = {
    getAll: jest.fn(),
  };
  return () => resourceService;
});

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('../services/SpacePlanAssignmentService', () => ({
  changeSpacePlanAssignment: jest.fn(),
}));

describe('SpacePlanAssignment', () => {
  const build = (props) => {
    render(
      <SpacePlanAssignment
        orgId={mockSpace.organization.sys.id}
        spaceId={mockSpace.sys.id}
        {...props}
      />
    );

    return waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));
  };

  beforeEach(() => {
    getSubscriptionPlans.mockResolvedValue({ total: mockPlans.length, items: mockPlans });
    getRatePlans.mockResolvedValue(mockRatePlans);
    getSpace.mockResolvedValue(mockSpace);
    createResourceService().getAll.mockResolvedValue(mockSpaceResources);
  });

  afterEach(Notification.closeAll);

  it('should render first step with a list of available plans grouped by type and limits', async () => {
    await build();
    expect(screen.getByText('Choose a new space type for Test Space')).toBeVisible();
    expect(screen.getAllByTestId('space-plan-item')).toHaveLength(4);
    expect(screen.getByTestId('go-back-btn')).toBeVisible();
    expect(screen.getByTestId('continue-btn')).toBeVisible();
  });

  it('should disable plans that are too small for the selected space', async () => {
    await build();
    //todo improve test case
    //current space is of type Performance 2x and has usage above Medium - see mockSpaceResources
    expect(screen.getByLabelText(mockMediumPlan.name)).toBeDisabled();
    expect(screen.getAllByLabelText(mockLargePlan1.name)[0]).not.toBeDisabled();
    expect(screen.getAllByLabelText(mockLargePlan1.name)[1]).not.toBeDisabled();
    expect(screen.getByLabelText(mockPerformance1xPlan.name)).not.toBeDisabled();
  });

  it('should group customized plans separately after the default one', async () => {
    await build();
    expect(screen.getAllByTestId('space-plan-item')).toHaveLength(4);
    expect(screen.getAllByLabelText('Large')).toHaveLength(2);
    const largePlanCardCustom = within(screen.getByTestId('space-plan-card-2'));
    expect(largePlanCardCustom.getByText('(Customized)')).toBeVisible();
  });

  it('should show number of available plans in each group', async () => {
    await build();

    const mediumPlanCard = within(screen.getByTestId('space-plan-card-0'));
    expect(mediumPlanCard.getByText('1 available')).toBeVisible();

    const largePlanCard = within(screen.getByTestId('space-plan-card-1'));
    expect(largePlanCard.getByText('2 available')).toBeVisible();

    const largeCustomPlanCard = within(screen.getByTestId('space-plan-card-2'));
    expect(largeCustomPlanCard.getByText('1 available')).toBeVisible();

    const performance1xPlanCard = within(screen.getByTestId('space-plan-card-3'));
    expect(performance1xPlanCard.getByText('1 available')).toBeVisible();
  });

  it('should show and hide comparison table between current plan and the other plans', async () => {
    await build();
    const mediumPlanCard = within(screen.getByTestId('space-plan-card-0'));
    const showTableLink = mediumPlanCard.getByText('Compare with current space type');
    expect(showTableLink).toBeVisible();
    userEvent.click(showTableLink);
    expect(mediumPlanCard.getByTestId('cf-ui-expandable-element--0')).toBeVisible();
    expect(mediumPlanCard.getByTestId('cf-ui-expandable-element--0')).toHaveAttribute(
      'data-active',
      'true'
    );
    const hideTableLink = mediumPlanCard.getByText('Hide details');
    expect(hideTableLink).toBeVisible();
    userEvent.click(hideTableLink);
    expect(mediumPlanCard.getByTestId('cf-ui-expandable-element--0')).toHaveAttribute(
      'data-active',
      'false'
    );
  });

  it('should disable continue btn if no plan selected', async () => {
    await build();
    expect(screen.getByTestId('continue-btn')).toBeVisible();
    // on initial load no plan is selected
    expect(screen.getByTestId('continue-btn')).toBeDisabled();
    // select a plan
    userEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
    expect(screen.getByTestId('continue-btn')).not.toBeDisabled();
  });

  it('should send tracking event on continue', async () => {
    await build();
    userEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
    userEvent.click(screen.getByTestId('continue-btn'));
    expect(track).toHaveBeenNthCalledWith(1, 'space_assignment:continue', {
      space_id: mockSpace.sys.id,
      current_plan_id: mockPerformance2xPlan.sys.id,
      current_plan_name: mockPerformance2xPlan.name,
      new_plan_id: mockPerformance1xPlan.sys.id,
      new_plan_name: mockPerformance1xPlan.name,
      flow: 'assing_plan_to_space',
    });
  });

  it('should send tracking event on go back', async () => {
    await build();
    userEvent.click(screen.getByTestId('go-back-btn'));
    expect(track).toHaveBeenNthCalledWith(1, 'space_assignment:back', {
      space_id: mockSpace.sys.id,
      flow: 'assing_plan_to_space',
    });
  });

  it('should show confirmation page on continue', async () => {
    await build();
    userEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
    userEvent.click(screen.getByTestId('continue-btn'));
    expect(screen.getByText('One more thing', { exact: false })).toBeVisible();
  });

  it('should show call service call with correct arguments', async () => {
    await build();
    userEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
    userEvent.click(screen.getByTestId('continue-btn'));
    userEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() =>
      expect(changeSpacePlanAssignment).toHaveBeenCalledWith(
        mockSpace.organization.sys.id,
        mockSpace.sys.id,
        mockPerformance1xPlan,
        mockPerformance2xPlan,
        mockFreePlan
      )
    );
  });

  it('should show success notification if new plan could be assigned', async () => {
    await build();
    userEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
    userEvent.click(screen.getByTestId('continue-btn'));
    userEvent.click(screen.getByTestId('confirm-btn'));
    await screen.findByText(
      `${mockSpace.name} was successfully changed to ${mockPerformance1xPlan.name}`
    );
  });

  it('should show error if new plan could not be assigned', async () => {
    changeSpacePlanAssignment.mockRejectedValue();
    await build();
    userEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
    userEvent.click(screen.getByTestId('continue-btn'));
    userEvent.click(screen.getByTestId('confirm-btn'));
    await screen.findByText(
      `Something went wrong while changing the space type. Please retry or contact support if the problem persists.`
    );
  });

  it('should send tracking event on confirm', async () => {
    await build();
    userEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
    userEvent.click(screen.getByTestId('continue-btn'));
    userEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() =>
      expect(track).toHaveBeenNthCalledWith(1, 'space_assignment:continue', {
        space_id: mockSpace.sys.id,
        current_plan_id: mockPerformance2xPlan.sys.id,
        current_plan_name: mockPerformance2xPlan.name,
        new_plan_id: mockPerformance1xPlan.sys.id,
        new_plan_name: mockPerformance1xPlan.name,
        flow: 'assing_plan_to_space',
      })
    );
  });
});
