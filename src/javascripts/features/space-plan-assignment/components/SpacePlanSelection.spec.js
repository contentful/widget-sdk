import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpacePlanSelection } from './SpacePlanSelection';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';

const mockRatePlanCharges = [
  Fake.RatePlanCharge({ name: 'Roles' }),
  Fake.RatePlanCharge({ name: 'Content types' }),
  Fake.RatePlanCharge({ name: 'Locales' }),
  Fake.RatePlanCharge({ name: 'Environments' }),
  Fake.RatePlanCharge({ name: 'Records' }),
];
const mockLargePlan1 = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockRatePlanCharges,
});
const mockLargePlan2 = Fake.Plan({ name: 'Large', ratePlanCharges: mockRatePlanCharges });
const mockPerformance1xPlan = Fake.Plan({
  name: 'Performance 1x',
  ratePlanCharges: mockRatePlanCharges,
});
const mockPlans = [mockLargePlan1, mockLargePlan2, mockPerformance1xPlan];

const mockSpace = Fake.Space();
const mockSpaceResources = {
  environment: Fake.SpaceResource(0, 5, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  role: Fake.SpaceResource(2, 5, 'role'),
  content_type: Fake.SpaceResource(25, 96, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 100000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 30, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};

const mockOnPlanSelected = jest.fn();
const mockHandleNavigationNext = jest.fn();

describe('SpacePlanSelection', () => {
  const build = (props) => {
    return render(
      <SpacePlanSelection
        plans={mockPlans}
        space={mockSpace}
        spaceResources={mockSpaceResources}
        selectedPlan={mockLargePlan1}
        onPlanSelected={mockOnPlanSelected}
        handleNavigationNext={mockHandleNavigationNext}
        {...props}
      />
    );
  };

  it('should render available plans list grouped', async () => {
    build();
    expect(screen.getAllByTestId('space-plan-item')).toHaveLength(2);
    expect(screen.getAllByLabelText(mockLargePlan1.name)).toHaveLength(1);
    expect(screen.getAllByLabelText(mockPerformance1xPlan.name)).toHaveLength(1);
  });

  it('should be able to select a new plan', async () => {
    build();
    expect(screen.getByLabelText(mockLargePlan1.name)).toBeChecked();
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
