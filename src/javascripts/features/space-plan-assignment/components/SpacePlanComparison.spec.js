import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpacePlanComparison } from './SpacePlanComparison';
import * as Fake from 'test/helpers/fakeFactory';
import * as PricingService from 'services/PricingService';

const mockRatePlanCharges = [
  Fake.RatePlanCharge('Roles', 4),
  Fake.RatePlanCharge('Content types', 48),
  Fake.RatePlanCharge('Locales', 10),
  Fake.RatePlanCharge('Environments', 5),
  Fake.RatePlanCharge('Records', 50000),
];
const mockPlanLarge = Fake.Plan({
  name: 'Large',
  ratePlanCharges: mockRatePlanCharges,
  roleSet: {
    roles: [],
  },
});
const mockSpaceResources = {
  role: Fake.SpaceResource(2, 5, 'role'),
  environment: Fake.SpaceResource(0, 6, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  content_type: Fake.SpaceResource(25, 48, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(2000, 50000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
  locale: Fake.SpaceResource(2, 10, PricingService.SPACE_PLAN_RESOURCE_TYPES.LOCALE),
};

const mockSpaceResourcesRecordsOverLimit = {
  role: Fake.SpaceResource(3, 5, 'role'),
  environment: Fake.SpaceResource(0, 6, PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT),
  content_type: Fake.SpaceResource(25, 48, PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE),
  record: Fake.SpaceResource(50001, 50000, PricingService.SPACE_PLAN_RESOURCE_TYPES.RECORD),
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
    build({ spaceResources: mockSpaceResourcesRecordsOverLimit });
    expect(screen.getAllByTestId('cf-ui-icon')).toHaveLength(1);
  });

  it('should increase role and environment usage by one to account for "admin" and "master" defaults', async () => {
    build({ spaceResources: mockSpaceResources });
    // the mocked resource has only 2 roles
    expect(screen.getAllByText('3')).toHaveLength(1);
    // the mocked resource has 0 environments
    expect(screen.getAllByText('1')).toHaveLength(1);
  });
});