import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpacePlanComparison } from './SpacePlanComparison';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';

const mockRatePlanCharges = [
  Fake.RatePlanCharge({ name: 'Roles' }),
  Fake.RatePlanCharge({ name: 'Content types' }),
  Fake.RatePlanCharge({ name: 'Locales' }),
  Fake.RatePlanCharge({ name: 'Environments' }),
  Fake.RatePlanCharge({ name: 'Records' }),
];
const mockPlanLarge = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockRatePlanCharges,
});
const mockSpaceResources = {
  role: Fake.SpaceResource(2, 5, 'role'),
  environment: Fake.SpaceResource(0, 6, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  content_type: Fake.SpaceResource(25, 48, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 50000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 10, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};

const mockSpaceResourcesRolesOverLimit = {
  role: Fake.SpaceResource(6, 5, 'role'),
  environment: Fake.SpaceResource(0, 6, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  content_type: Fake.SpaceResource(25, 48, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 50000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 10, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};

describe('SpacePlanComparison', () => {
  const build = (props) => {
    return render(
      <SpacePlanComparison plan={mockPlanLarge} spaceResources={mockSpaceResources} {...props} />
    );
  };

  it('should render comparison table', async () => {
    build();
    expect(screen.getByTestId('cf-ui-table')).toBeVisible();
    expect(screen.getAllByTestId('cf-ui-table-row')).toHaveLength(3);
  });

  it('should not show warning icon if there are no over limit usage', async () => {
    build();
    expect(screen.queryAllByTestId('cf-ui-icon')).toHaveLength(0);
  });

  it('should show warning icon if space roles usage is over limit', async () => {
    build({ spaceResources: mockSpaceResourcesRolesOverLimit });
    expect(screen.getAllByTestId('cf-ui-icon')).toHaveLength(1);
  });
});
