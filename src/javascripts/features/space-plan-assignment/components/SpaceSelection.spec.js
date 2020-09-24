import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceSelection } from './SpaceSelection';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';

const mockRatePlanCharges = [
  Fake.RatePlanCharge({ name: 'Roles' }),
  Fake.RatePlanCharge({ name: 'Content types' }),
  Fake.RatePlanCharge({ name: 'Locales' }),
  Fake.RatePlanCharge({ name: 'Environments' }),
  Fake.RatePlanCharge({ name: 'Records' }),
];

const mockPerformance1xPlan = Fake.Plan({
  name: 'Performance 1x',
  ratePlanCharges: mockRatePlanCharges,
  roleSet: { roles: [] },
});

const mockSpace1 = Fake.Space({ name: 'Space1' });
const mockSpace2 = Fake.Space({ name: 'Space2' });
const mockSpaces = [mockSpace1, mockSpace2];

const mockSpace1Resources = {
  environment: Fake.SpaceResource(0, 5, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  role: Fake.SpaceResource(2, 5, 'role'),
  content_type: Fake.SpaceResource(25, 96, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 100000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 30, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};
const mockSpace2Resources = {
  environment: Fake.SpaceResource(1, 5, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  role: Fake.SpaceResource(4, 5, 'role'),
  content_type: Fake.SpaceResource(52, 96, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 100000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 30, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};

const mockSpaceResources = {
  [mockSpace1.sys.id]: mockSpace1Resources,
  [mockSpace2.sys.id]: mockSpace2Resources,
};

const mockLargePlan = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockRatePlanCharges,
  roleSet: { roles: [] },
});
const mockPlansBySpace = {
  [mockSpace1.sys.id]: mockLargePlan,
  [mockSpace2.sys.id]: mockLargePlan,
};

const mockOnSpaceSelected = jest.fn();
const mockHandleNavigationNext = jest.fn();

describe('SpaceSelection', () => {
  const build = (props) => {
    return render(
      <SpaceSelection
        plan={mockPerformance1xPlan}
        spaces={mockSpaces}
        plansBySpace={mockPlansBySpace}
        spaceResourcesBySpace={mockSpaceResources}
        selectedSpace={mockSpace1}
        onSpaceSelected={mockOnSpaceSelected}
        handleNavigationNext={mockHandleNavigationNext}
        {...props}
      />
    );
  };

  it('should render existing spaces', async () => {
    build();
    expect(screen.getAllByTestId('space-item')).toHaveLength(2);
    expect(screen.getByText(mockSpace1.name)).toBeVisible();
    expect(screen.getByText(mockSpace2.name)).toBeVisible();
  });

  it('should be able to select a new splace', async () => {
    build();
    expect(screen.getByLabelText(mockSpace1.name)).toBeChecked();
    expect(screen.getByLabelText(mockSpace1.name)).not.toBeDisabled();
    fireEvent.click(screen.getByLabelText(mockSpace2.name));
    expect(mockOnSpaceSelected).toHaveBeenCalled();
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
