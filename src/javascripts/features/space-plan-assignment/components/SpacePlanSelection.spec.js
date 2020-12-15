import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpacePlanSelection } from './SpacePlanSelection';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';

const mockSpace = Fake.Space();
const mockSpaceResources = {
  environment: Fake.SpaceResource(0, 5, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  role: Fake.SpaceResource(2, 5, 'role'),
  content_type: Fake.SpaceResource(25, 96, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 100000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 30, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};

const mockRatePlanCharges = [
  Fake.RatePlanCharge('Environments', 5),
  Fake.RatePlanCharge('Roles', 4),
  Fake.RatePlanCharge('Locales', 10),
  Fake.RatePlanCharge('Content types', 48),
  Fake.RatePlanCharge('Records', 50000),
];
const mockLargePlan = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockRatePlanCharges,
  roleSet: {
    roles: [],
  },
});
const mockLargePlan2 = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockRatePlanCharges,
  roleSet: { roles: [] },
});

const mockLargePlanCustom = Fake.Plan({
  name: 'Large',
  ratePlanCharges: [
    Fake.RatePlanCharge('Environments', 5),
    Fake.RatePlanCharge('Roles', 4),
    Fake.RatePlanCharge('Locales', 20),
    Fake.RatePlanCharge('Content types', 4800),
    Fake.RatePlanCharge('Records', 50000),
  ],
  roleSet: { roles: [] },
});
const mockPerformance1xPlan = Fake.Plan({
  name: 'Performance 1x',
  ratePlanCharges: mockRatePlanCharges,
  gatekeeperKey: mockSpace.sys.id,
  roleSet: {
    roles: [],
  },
});

const mockPlans = [mockLargePlan, mockLargePlan2, mockLargePlanCustom, mockPerformance1xPlan];
const mockRatePlans = [
  Fake.Plan({
    name: 'Large',
    productRatePlanCharges: mockRatePlanCharges,
  }),
  Fake.Plan({
    name: 'Performance 1x',
    productRatePlanCharges: mockRatePlanCharges,
  }),
];

const mockFreePlan = Fake.Plan({
  name: 'Proof of concept',
  productPlanType: 'free_space',
  productRatePlanCharges: mockRatePlanCharges,
  roleSet: { roles: [] },
});
const mockFreeSpaceResource = Fake.OrganizationResource(1, 5, 'free_space');

const mockOnPlanSelected = jest.fn();
const mockHandleNavigationNext = jest.fn();

describe('SpacePlanSelection', () => {
  describe('assignment flow', () => {
    const build = (props) => {
      return render(
        <SpacePlanSelection
          plans={mockPlans}
          ratePlans={mockRatePlans}
          space={mockSpace}
          spaceResources={mockSpaceResources}
          selectedPlan={mockLargePlan}
          currentPlanName={mockPerformance1xPlan.name}
          onPlanSelected={mockOnPlanSelected}
          handleNavigationNext={mockHandleNavigationNext}
          flowType="assignment"
          {...props}
        />
      );
    };

    it('should render available plans list grouped', async () => {
      build();
      expect(screen.getAllByTestId('space-plan-item')).toHaveLength(3);
      expect(screen.getAllByLabelText(mockLargePlan.name)).toHaveLength(2);
      expect(screen.getAllByLabelText(mockPerformance1xPlan.name)).toHaveLength(1);
    });

    it('should be able to select a new plan', async () => {
      build();
      expect(screen.getAllByLabelText(mockLargePlan.name)[0]).toBeChecked();
      fireEvent.click(screen.getByLabelText(mockPerformance1xPlan.name));
      expect(mockOnPlanSelected).toHaveBeenCalled();
    });

    it('should click on the first element and expand first layer', async () => {
      build();
      fireEvent.click(screen.getAllByTestId('cf-ui-expandable-panel-link')[0]);

      expect(screen.getByTestId('cf-ui-expandable-element--0')).toBeVisible();
      expect(screen.getByTestId('cf-ui-expandable-element--0')).toHaveAttribute(
        'data-active',
        'true'
      );
      expect(screen.getByTestId('cf-ui-expandable-element--1')).toHaveAttribute(
        'data-active',
        'false'
      );
    });

    it('should expand and on the second click close the expanded layer', async () => {
      build();
      fireEvent.click(screen.getAllByTestId('cf-ui-expandable-panel-link')[0]);
      expect(screen.getByTestId('cf-ui-expandable-element--0')).toHaveAttribute(
        'data-active',
        'true'
      );

      fireEvent.click(screen.getAllByTestId('cf-ui-expandable-panel-link')[0]);
      expect(screen.getByTestId('cf-ui-expandable-element--0')).toHaveAttribute(
        'data-active',
        'false'
      );
    });
  });

  describe('creation flow', () => {
    const build = (props) => {
      return render(
        <SpacePlanSelection
          plans={[...mockPlans, mockFreePlan]}
          ratePlans={mockRatePlans}
          space={mockSpace}
          spaceResources={mockSpaceResources}
          selectedPlan={mockLargePlan}
          currentPlanName={mockPerformance1xPlan.name}
          onPlanSelected={mockOnPlanSelected}
          handleNavigationNext={mockHandleNavigationNext}
          flowType="creation"
          {...props}
        />
      );
    };

    it('should render create flow with available plans list grouped', async () => {
      build({ freeSpaceResource: mockFreeSpaceResource });
      expect(screen.getByText('Choose a space type for your new space')).toBeVisible();
      expect(screen.getAllByTestId('space-plan-item')).toHaveLength(4);
      expect(screen.getAllByLabelText(mockLargePlan.name)).toHaveLength(2);
      expect(screen.getAllByLabelText(mockPerformance1xPlan.name)).toHaveLength(1);
      expect(screen.getAllByLabelText(mockFreePlan.name)).toHaveLength(1);
    });
  });
});
